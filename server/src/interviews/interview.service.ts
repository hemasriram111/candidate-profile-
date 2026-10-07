import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

function serializeInterview(interview: Prisma.InterviewGetPayload<{ include: { application: { include: { job: { include: { company: true } } } } } }>) {
  return {
    id: interview.id,
    applicationId: interview.applicationId,
    jobTitle: interview.application.job.title,
    companyName: interview.application.job.company.name,
    location: interview.application.job.location,
    scheduledAt: interview.scheduledAt?.toISOString() ?? null,
    meetingLink: interview.meetingLink,
    status: interview.status,
    interviewerName: interview.interviewerName,
    notes: interview.notes,
  }
}

@Injectable()
export class InterviewService {
  constructor(private readonly prisma: PrismaService) {}

  async listInterviews(userId: string) {
    const interviews = await this.prisma.interview.findMany({
      where: { application: { userId } },
      include: {
        application: { include: { job: { include: { company: true } } } },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    return interviews.map((interview) => serializeInterview(interview))
  }

  async getInterview(userId: string, interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: { include: { job: { include: { company: true } } } },
      },
    })

    if (!interview) {
      throw new NotFoundException('Interview not found.')
    }

    if (interview.application.userId !== userId) {
      throw new NotFoundException('Interview not found for this candidate.')
    }

    return serializeInterview(interview)
  }
}
