import { Injectable, NotFoundException } from '@nestjs/common'
import { JobStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { serializeJob } from './job.service'

@Injectable()
export class SavedJobService {
  constructor(private readonly prisma: PrismaService) {}

  async listSavedJobs(userId: string) {
    const savedJobs = await this.prisma.savedJob.findMany({
      where: { userId },
      include: { job: { include: { company: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return {
      items: savedJobs.map(({ job, createdAt }) => ({
        ...serializeJob(job),
        savedAt: createdAt.toISOString(),
      })),
      total: savedJobs.length,
    }
  }

  async saveJob(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true },
    })

    if (!job || job.status !== JobStatus.OPEN) {
      throw new NotFoundException('Open job not found.')
    }

    const savedJob = await this.prisma.savedJob.upsert({
      where: { userId_jobId: { userId, jobId } },
      create: { userId, jobId },
      update: {},
      include: { job: { include: { company: true } } },
    })

    return {
      ...serializeJob(savedJob.job),
      savedAt: savedJob.createdAt.toISOString(),
    }
  }

  async removeSavedJob(userId: string, jobId: string) {
    await this.prisma.savedJob.deleteMany({ where: { userId, jobId } })
  }
}
