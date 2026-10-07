import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthGuard } from '../auth/guards/auth.guard'
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'
import { CandidateRoleGuard } from '../candidate/candidate-role.guard'
import { RespondOfferDto } from './dto/respond-offer.dto'
import { OfferService } from './offer.service'

@Controller('offers')
@UseGuards(AuthGuard, CandidateRoleGuard)
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Get()
  async listOffers(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.offerService.listOffers(request.user.sub)
  }

  @Get(':id')
  async getOffer(
    @Param('id') id: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.offerService.getOffer(request.user.sub, id)
  }

  @Patch(':id/respond')
  async respondToOffer(
    @Param('id') id: string,
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: RespondOfferDto,
  ) {
    return this.offerService.respondToOffer(request.user.sub, id, dto)
  }
}
