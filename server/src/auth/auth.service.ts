import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Prisma, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'
import { Response } from 'express'
import { CandidateService } from '../candidate/candidate.service'
import { EmailService } from '../email/email.service'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { GoogleAuthDto } from './dto/google-auth.dto'
import { LoginDto } from './dto/login.dto'
import { ResendVerificationDto } from './dto/resend-verification.dto'
import { RegisterDto } from './dto/register.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'

const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000
const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000
const MAX_VERIFICATION_ATTEMPTS = 5

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly candidateService: CandidateService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'))
  }

  private getCookieOptions() {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production'

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    }
  }

  private setSessionCookie(response: Response, userId: string, role: Role, email: string) {
    const token = this.jwtService.sign({
      sub: userId,
      email,
      role,
    })

    response.cookie('clyptus_session', token, this.getCookieOptions())
  }

  private isEmailVerificationRequired() {
    const value = this.configService.get<string>('EMAIL_VERIFICATION_REQUIRED', 'false').trim().toLowerCase()
    return value !== 'false' && value !== '0' && value !== 'no' && value !== 'off' && value !== ''
  }

  private sanitizeUser(user: any) {
    const role = typeof user.role === 'string' ? user.role.toLowerCase() : user.role

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      profile: user.candidateProfile ?? null,
      onboardingComplete: role !== 'candidate' || user.candidateProfile?.resumeOnboardingComplete === true,
      resumeReadyForReview: user.resumes?.[0]?.status === 'PARSED',
    }
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase()
    const fullName = dto.fullName.trim()

    if (!fullName) {
      throw new BadRequestException('Full name is required.')
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.')
    }

    const existingUser = await this.usersService.findByEmail(email)
    if (existingUser) {
      throw new ConflictException('An account with this email already exists.')
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)
    const emailVerificationRequired = this.isEmailVerificationRequired()
    const verification = emailVerificationRequired ? this.createVerificationCode(email) : null

    try {
      await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            email,
            name: fullName,
            passwordHash,
            emailVerified: !emailVerificationRequired,
            verificationOtpHash: emailVerificationRequired ? verification!.hash : null,
            verificationOtpExpiresAt: emailVerificationRequired ? verification!.expiresAt : null,
            verificationOtpAttempts: 0,
            verificationOtpLastSentAt: emailVerificationRequired ? verification!.sentAt : null,
            role: 'CANDIDATE',
            isActive: true,
          },
        })

        await transaction.authAccount.create({
          data: {
            userId: user.id,
            provider: 'LOCAL',
            providerAccountId: `local:${user.id}`,
          },
        })
        await transaction.candidateProfile.create({
          data: { userId: user.id, resumeOnboardingComplete: false },
        })

        if (emailVerificationRequired) {
          await this.emailService.sendVerificationEmail({ email, name: fullName, otp: verification!.otp })
        }
      }, { maxWait: 10_000, timeout: 30_000 })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with this email already exists.')
      }
      throw error
    }

    return {
      requiresEmailVerification: emailVerificationRequired,
      email,
      message: emailVerificationRequired ? 'Verification code sent to your email.' : 'Account created successfully.',
      resendCooldownSeconds: emailVerificationRequired ? VERIFICATION_RESEND_COOLDOWN_MS / 1000 : 0,
    }
  }

  async login(dto: LoginDto, response: Response) {
    const email = dto.email.trim().toLowerCase()
    const user = await this.usersService.findByEmail(email)

    if (!user || !user.passwordHash || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password.')
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.')
    }

    if (this.isEmailVerificationRequired() && !user.emailVerified) {
      throw new ForbiddenException({
        message: 'Please verify your email before signing in.',
        requiresEmailVerification: true,
        email,
        resendCooldownSeconds: this.getResendCooldownSeconds(user.verificationOtpLastSentAt),
      })
    }

    this.setSessionCookie(response, user.id, user.role, user.email)

    return {
      user: this.sanitizeUser(user),
    }
  }

  async logout(response: Response) {
    response.clearCookie('clyptus_session', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    })

    return { success: true }
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new UnauthorizedException('Authentication required.')
    }

    return {
      user: this.sanitizeUser(user),
    }
  }

  async verifyEmail(dto: VerifyEmailDto, response: Response) {
    const email = dto.email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user || !user.passwordHash) {
      throw new BadRequestException('Invalid verification code.')
    }
    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified. Please sign in.')
    }
    if (user.verificationOtpAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      throw new HttpException('Too many attempts. Please request a new code.', HttpStatus.TOO_MANY_REQUESTS)
    }
    if (!user.verificationOtpHash || !user.verificationOtpExpiresAt) {
      throw new BadRequestException('Verification code expired. Please request a new code.')
    }

    const now = new Date()
    if (user.verificationOtpExpiresAt <= now) {
      await this.prisma.user.updateMany({
        where: { id: user.id, verificationOtpHash: user.verificationOtpHash, emailVerified: false },
        data: {
          verificationOtpHash: null,
          verificationOtpExpiresAt: null,
          verificationOtpAttempts: 0,
          verificationOtpLastSentAt: null,
        },
      })
      throw new BadRequestException('Verification code expired. Please request a new code.')
    }

    const expectedHash = Buffer.from(user.verificationOtpHash, 'hex')
    const submittedHash = Buffer.from(this.hashVerificationCode(email, dto.otp), 'hex')
    const isValid = expectedHash.length === submittedHash.length && timingSafeEqual(expectedHash, submittedHash)

    if (!isValid) {
      const attempt = await this.prisma.user.updateMany({
        where: {
          id: user.id,
          emailVerified: false,
          verificationOtpHash: user.verificationOtpHash,
          verificationOtpAttempts: user.verificationOtpAttempts,
        },
        data: { verificationOtpAttempts: { increment: 1 } },
      })

      if (attempt.count === 0) {
        throw new BadRequestException('Invalid verification code.')
      }
      if (user.verificationOtpAttempts + 1 >= MAX_VERIFICATION_ATTEMPTS) {
        await this.prisma.user.updateMany({
          where: {
            id: user.id,
            verificationOtpHash: user.verificationOtpHash,
            verificationOtpAttempts: MAX_VERIFICATION_ATTEMPTS,
          },
          data: { verificationOtpHash: null, verificationOtpExpiresAt: null },
        })
        throw new HttpException('Too many attempts. Please request a new code.', HttpStatus.TOO_MANY_REQUESTS)
      }
      throw new BadRequestException('Invalid verification code.')
    }

    const verified = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        emailVerified: false,
        verificationOtpHash: user.verificationOtpHash,
        verificationOtpExpiresAt: { gt: now },
        verificationOtpAttempts: { lt: MAX_VERIFICATION_ATTEMPTS },
      },
      data: {
        emailVerified: true,
        verificationOtpHash: null,
        verificationOtpExpiresAt: null,
        verificationOtpAttempts: 0,
        verificationOtpLastSentAt: null,
      },
    })

    if (verified.count !== 1) {
      throw new BadRequestException('Verification code expired. Please request a new code.')
    }

    const refreshedUser = await this.usersService.findById(user.id)
    if (!refreshedUser) {
      throw new UnauthorizedException('Authentication required.')
    }

    this.setSessionCookie(response, refreshedUser.id, refreshedUser.role, refreshedUser.email)
    return { user: this.sanitizeUser(refreshedUser) }
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        emailVerified: true,
        verificationOtpLastSentAt: true,
      },
    })

    if (!user || !user.passwordHash || user.emailVerified) {
      throw new BadRequestException('No pending email verification was found for this address.')
    }

    const retryAfterSeconds = this.getResendCooldownSeconds(user.verificationOtpLastSentAt)
    if (retryAfterSeconds > 0) {
      throw new HttpException({
        message: 'Please wait before requesting another verification code.',
        retryAfterSeconds,
      }, HttpStatus.TOO_MANY_REQUESTS)
    }

    const verification = this.createVerificationCode(email)
    const updated = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        emailVerified: false,
        verificationOtpLastSentAt: user.verificationOtpLastSentAt,
      },
      data: {
        verificationOtpHash: verification.hash,
        verificationOtpExpiresAt: verification.expiresAt,
        verificationOtpAttempts: 0,
        verificationOtpLastSentAt: verification.sentAt,
      },
    })

    if (updated.count !== 1) {
      throw new HttpException('Please wait before requesting another verification code.', HttpStatus.TOO_MANY_REQUESTS)
    }

    try {
      await this.emailService.sendVerificationEmail({ email, name: user.name, otp: verification.otp })
    } catch (error) {
      await this.prisma.user.updateMany({
        where: { id: user.id, verificationOtpHash: verification.hash, emailVerified: false },
        data: { verificationOtpHash: null, verificationOtpExpiresAt: null, verificationOtpAttempts: 0 },
      })
      throw error
    }

    return {
      message: 'A new verification code has been sent.',
      resendCooldownSeconds: VERIFICATION_RESEND_COOLDOWN_MS / 1000,
    }
  }

  private createVerificationCode(email: string) {
    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0')
    const sentAt = new Date()
    return {
      otp,
      hash: this.hashVerificationCode(email, otp),
      expiresAt: new Date(sentAt.getTime() + VERIFICATION_CODE_TTL_MS),
      sentAt,
    }
  }

  private hashVerificationCode(email: string, otp: string) {
    const secret = this.configService.get<string>('OTP_HASH_SECRET')
      ?? this.configService.getOrThrow<string>('JWT_SECRET')
    return createHmac('sha256', secret).update(`${email}:${otp}`).digest('hex')
  }

  private getResendCooldownSeconds(lastSentAt: Date | null) {
    if (!lastSentAt) return 0
    return Math.max(0, Math.ceil((lastSentAt.getTime() + VERIFICATION_RESEND_COOLDOWN_MS - Date.now()) / 1000))
  }

  async googleLogin(dto: GoogleAuthDto, response: Response) {
    let payload: any

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.credential,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      })
      payload = ticket.getPayload()
    } catch {
      throw new UnauthorizedException('Google authentication failed.')
    }

    if (!payload?.email || !payload?.sub) {
      throw new UnauthorizedException('Google authentication failed.')
    }

    const email = payload.email.trim().toLowerCase()
    const googleSubjectId = payload.sub
    const primaryName = payload.name || payload.email.split('@')[0]

    const existingGoogleAccount = await this.usersService.findAuthAccount('GOOGLE', googleSubjectId)
    if (existingGoogleAccount?.user) {
      const user = existingGoogleAccount.user
      this.setSessionCookie(response, user.id, user.role, user.email)
      return { user: this.sanitizeUser(user) }
    }

    const existingEmailUser = await this.usersService.findByEmail(email)
    if (existingEmailUser) {
      throw new ConflictException(
        'An account already exists with this email. Please sign in with your password.',
      )
    }

    const createdUser = await this.usersService.createGoogleUser({
      email,
      name: primaryName,
      role: 'CANDIDATE',
    })

    await this.usersService.createAuthAccount({
      userId: createdUser.id,
      provider: 'GOOGLE',
      providerAccountId: googleSubjectId,
    })

    await this.candidateService.createCandidateProfile(createdUser.id)

    const refreshedUser = await this.usersService.findById(createdUser.id)
    if (!refreshedUser) {
      throw new BadRequestException('Google user could not be created.')
    }

    this.setSessionCookie(response, refreshedUser.id, refreshedUser.role, refreshedUser.email)

    return {
      user: this.sanitizeUser(refreshedUser),
    }
  }
}
