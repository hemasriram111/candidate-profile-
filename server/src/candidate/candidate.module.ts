import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthSessionModule } from '../auth/auth-session.module'
import { CandidateController } from './candidate.controller'
import { CandidateRoleGuard } from './candidate-role.guard'
import { CandidateService } from './candidate.service'
import { ResumeParserService } from './resume-parser.service'
import { ResumeService } from './resume.service'

@Module({
  imports: [PrismaModule, AuthSessionModule],
  controllers: [CandidateController],
  providers: [CandidateService, CandidateRoleGuard, ResumeParserService, ResumeService],
  exports: [CandidateService],
})
export class CandidateModule {}
