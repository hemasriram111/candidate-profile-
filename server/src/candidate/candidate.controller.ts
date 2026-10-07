import {
  BadRequestException,
  Body,
  Delete,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { Request, Response } from 'express'
import { AuthGuard } from '../auth/guards/auth.guard'
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'
import { CandidateRoleGuard } from './candidate-role.guard'
import { CandidateService } from './candidate.service'
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto'
import { ResumeService } from './resume.service'

const MAX_RESUME_SIZE = 8 * 1024 * 1024
const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

@Controller('candidate')
@UseGuards(AuthGuard)
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly resumeService: ResumeService,
  ) {}

  @Get('profile')
  @UseGuards(CandidateRoleGuard)
  getProfile(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.candidateService.getProfile(request.user.sub)
  }

  @Patch('profile')
  @UseGuards(CandidateRoleGuard)
  updateProfile(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    return this.candidateService.updateProfile(request.user.sub, dto)
  }

  @Get('resume')
  @UseGuards(CandidateRoleGuard)
  async candidateResume(
    @Req() request: Request & { user: AuthenticatedUser },
    @Res() response: Response,
  ) {
    const file = await this.candidateService.getCandidateResumeFile(request.user.sub)
    response.type(file.mimeType)
    response.setHeader('Cache-Control', 'private, no-store')
    response.sendFile(file.path)
  }

  @Get('recruiter-profile/:profileId')
  recruiterProfile(
    @Param('profileId') profileId: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.candidateService.getRecruiterVisibleProfile(profileId, request.user.sub, request.user.role)
  }

  @Get('recruiter-profile/:profileId/resume')
  async recruiterResume(
    @Param('profileId') profileId: string,
    @Req() request: Request & { user: AuthenticatedUser },
    @Res() response: Response,
  ) {
    const file = await this.candidateService.getRecruiterResumeFile(profileId, request.user.sub, request.user.role)
    response.type(file.mimeType)
    response.setHeader('Cache-Control', 'private, no-store')
    response.download(file.path, file.fileName)
  }

  @Post('resume')
  @UseGuards(CandidateRoleGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: MAX_RESUME_SIZE },
    fileFilter: (_request, file, callback) => {
      const extension = file.originalname.split('.').pop()?.toLowerCase() ?? ''
      if (MIME_BY_EXTENSION[extension] !== file.mimetype) {
        callback(new BadRequestException('Please upload a PDF, DOC, or DOCX file.'), false)
        return
      }
      callback(null, true)
    },
  }))
  uploadResume(
    @Req() request: Request & { user: AuthenticatedUser },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.resumeService.uploadAndProcess(request.user.sub, file)
  }

  @Get('profile-photo')
  @UseGuards(CandidateRoleGuard)
  async getProfilePhoto(
    @Req() request: Request & { user: AuthenticatedUser },
    @Res() response: Response,
  ) {
    const photo = await this.candidateService.getProfilePhoto(request.user.sub)
    response.type(photo.mimeType)
    response.setHeader('Cache-Control', 'private, no-store')
    response.sendFile(photo.path)
  }

  @Post('profile-photo')
  @UseGuards(CandidateRoleGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: MAX_PROFILE_PHOTO_SIZE },
    fileFilter: (_request, file, callback) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        callback(new BadRequestException('Upload a JPEG, PNG, or WebP profile photo.'), false)
        return
      }
      callback(null, true)
    },
  }))
  uploadProfilePhoto(
    @Req() request: Request & { user: AuthenticatedUser },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.candidateService.uploadProfilePhoto(request.user.sub, file)
  }

  @Delete('profile-photo')
  @UseGuards(CandidateRoleGuard)
  removeProfilePhoto(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.candidateService.removeProfilePhoto(request.user.sub)
  }
}