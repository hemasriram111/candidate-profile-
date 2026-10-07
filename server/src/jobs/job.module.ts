import { Module } from '@nestjs/common'
import { AuthSessionModule } from '../auth/auth-session.module'
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard'
import { CandidateRoleGuard } from '../candidate/candidate-role.guard'
import { PrismaModule } from '../prisma/prisma.module'
import { CandidateJobRecommendationService } from './candidate-job-recommendation.service'
import { JobController } from './job.controller'
import { JobService } from './job.service'
import { SavedJobController } from './saved-job.controller'
import { SavedJobService } from './saved-job.service'

@Module({
  imports: [PrismaModule, AuthSessionModule],
  controllers: [JobController, SavedJobController],
  providers: [JobService, SavedJobService, CandidateJobRecommendationService, OptionalAuthGuard, CandidateRoleGuard],
  exports: [JobService],
})
export class JobModule {}
