import { Injectable, NotFoundException } from '@nestjs/common'
import { ApplicationStatus, OfferStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RespondOfferDto } from './dto/respond-offer.dto'

function serializeOffer(offer: Prisma.OfferGetPayload<{ include: { application: { include: { job: { include: { company: true } } } } } }>) {
  return {
    id: offer.id,
    applicationId: offer.applicationId,
    jobTitle: offer.application.job.title,
    companyName: offer.application.job.company.name,
    location: offer.application.job.location,
    title: offer.title,
    salary: offer.salary,
    joiningDate: offer.joiningDate?.toISOString() ?? null,
    message: offer.message,
    status: offer.status,
  }
}

@Injectable()
export class OfferService {
  constructor(private readonly prisma: PrismaService) {}

  async listOffers(userId: string) {
    const offers = await this.prisma.offer.findMany({
      where: { application: { userId } },
      include: { application: { include: { job: { include: { company: true } } } } },
      orderBy: { createdAt: 'desc' },
    })

    return offers.map((offer) => serializeOffer(offer))
  }

  async getOffer(userId: string, offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { application: { include: { job: { include: { company: true } } } } },
    })

    if (!offer) {
      throw new NotFoundException('Offer not found.')
    }

    if (offer.application.userId !== userId) {
      throw new NotFoundException('Offer not found for this candidate.')
    }

    return serializeOffer(offer)
  }

  async respondToOffer(userId: string, offerId: string, dto: RespondOfferDto) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { application: { include: { job: { include: { company: true } } } } },
    })

    if (!offer) {
      throw new NotFoundException('Offer not found.')
    }

    if (offer.application.userId !== userId) {
      throw new NotFoundException('Offer not found for this candidate.')
    }

    const applicationStatus = dto.status === OfferStatus.ACCEPTED ? ApplicationStatus.HIRED : ApplicationStatus.REJECTED

    const [updatedOffer] = await this.prisma.$transaction([
      this.prisma.offer.update({
        where: { id: offerId },
        data: { status: dto.status },
      }),
      this.prisma.application.update({
        where: { id: offer.applicationId },
        data: { status: applicationStatus },
      }),
    ])

    return {
      ...serializeOffer({
        ...offer,
        status: updatedOffer.status,
      }),
      applicationStatus,
    }
  }
}
