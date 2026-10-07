import { OfferStatus } from '@prisma/client'
import { IsEnum } from 'class-validator'

export class RespondOfferDto {
  @IsEnum(OfferStatus)
  status!: OfferStatus
}
