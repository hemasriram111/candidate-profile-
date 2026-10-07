import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ApplicationStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/create-application.dto'

function serializeApplication(application: Prisma.ApplicationGetPayload<{ include: { job: { include: { company: true } }; resume: true } }>) {
  return {
    id: application.id,
    jobId: application.jobId,
    jobTitle: application.job.title,
    companyName: application.job.company.name,
    companyLogo: application.job.company.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? '')
      .join('') || 'C',
    location: application.job.location,
    status: application.status,
    appliedAt: application.appliedAt.toISOString(),
    resume: application.resume ? {
      id: application.resume.id,
      originalFileName: application.resume.originalFileName,
      status: application.resume.status,
    } : null,
  }
}

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async listApplications(userId: string) {
    const applications = await this.prisma.application.findMany({
      where: { userId },
      include: {
        job: { include: { company: true } },
        resume: true,
      },
      orderBy: { appliedAt: 'desc' },
    })

    return applications.map((application) => serializeApplication(application))
  }

  async getApplication(userId: string, id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: { include: { company: true } },
        resume: true,
        interview: true,
        offers: true,
      },
    })

    if (!application) {
      throw new NotFoundException('Application not found.')
    }

    if (application.userId !== userId) {
      throw new ForbiddenException('You do not have access to this application.')
    }

    return {
      ...serializeApplication(application),
      interview: application.interview,
      offers: application.offers,
    }
  }

  async createApplication(userId: string, dto: CreateApplicationDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: { company: true },
    })

    if (!job) {
      throw new NotFoundException('Job not found.')
    }

    const resume = await this.prisma.resume.findFirst({
      where: {
        id: dto.resumeId,
        userId,
      },
    })

    if (!resume) {
      throw new NotFoundException('Resume not found for this candidate.')
    }

    const existing = await this.prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId: job.id,
        },
      },
    })

    if (existing) {
      throw new ConflictException('You have already applied to this job.')
    }

    const application = await this.prisma.application.create({
      data: {
        userId,
        jobId: job.id,
        resumeId: resume.id,
        status: ApplicationStatus.APPLIED,
      },
      include: {
        job: { include: { company: true } },
        resume: true,
      },
    })

    return serializeApplication(application)
  }

  async updateApplicationStatus(userId: string, id: string, dto: UpdateApplicationStatusDto) {
    const existing = await this.prisma.application.findUnique({
      where: { id },
      include: { job: { include: { company: true } }, resume: true },
    })

    if (!existing) {
      throw new NotFoundException('Application not found.')
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('You do not have access to this application.')
    }

    const application = await this.prisma.application.update({
      where: { id },
      data: { status: dto.status },
      include: {
        job: { include: { company: true } },
        resume: true,
      },
    })

    return serializeApplication(application)
  }
}
