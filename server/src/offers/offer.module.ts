import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthSessionModule } from '../auth/auth-session.module'
import { OfferController } from './offer.controller'
import { OfferService } from './offer.service'

@Module({
  imports: [PrismaModule, AuthSessionModule],
  controllers: [OfferController],
  providers: [OfferService],
  exports: [OfferService],
})
export class OfferModule {}
