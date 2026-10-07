import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { UsersModule } from '../users/users.module'
import { CandidateModule } from '../candidate/candidate.module'
import { EmailModule } from '../email/email.module'
import { AuthSessionModule } from './auth-session.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    CandidateModule,
    EmailModule,
    AuthSessionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, AuthSessionModule],
})
export class AuthModule {}
