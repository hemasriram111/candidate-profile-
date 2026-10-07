import { Injectable } from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        candidateProfile: true,
        authAccounts: true,
        resumes: { select: { status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        candidateProfile: true,
        authAccounts: true,
        resumes: { select: { status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
  }

  async createLocalUser(data: { email: string; name: string; passwordHash: string; role?: Role }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role ?? 'CANDIDATE',
        isActive: true,
      },
      include: { candidateProfile: true, authAccounts: true },
    })
  }

  async createGoogleUser(data: { email: string; name: string; role?: Role }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role ?? 'CANDIDATE',
        emailVerified: true,
        isActive: true,
      },
      include: { candidateProfile: true, authAccounts: true },
    })
  }

  async createAuthAccount(data: {
    userId: string
    provider: 'LOCAL' | 'GOOGLE'
    providerAccountId: string
  }) {
    return this.prisma.authAccount.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
      },
    })
  }

  async findAuthAccount(provider: 'LOCAL' | 'GOOGLE', providerAccountId: string) {
    return this.prisma.authAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: {
          include: {
            candidateProfile: true,
            authAccounts: true,
            resumes: { select: { status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    })
  }
}
