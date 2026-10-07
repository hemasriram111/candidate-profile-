import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthGuard } from '../auth/guards/auth.guard'
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard'
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'
import { CandidateRoleGuard } from '../candidate/candidate-role.guard'
import { JobQueryDto } from './dto/job-query.dto'
import { JobService } from './job.service'

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  async listJobs(
    @Query() query: JobQueryDto,
    @Req() request: Request & { user?: AuthenticatedUser },
  ) {
    const candidateId = request.user?.role.toUpperCase() === 'CANDIDATE' ? request.user.sub : undefined
    return this.jobService.listJobs(query, candidateId)
  }

  @Get('recommended')
  @UseGuards(AuthGuard, CandidateRoleGuard)
  async recommendedJobs(
    @Query() query: JobQueryDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.jobService.listRecommendedJobs(request.user.sub, query)
  }

  @Get(':id')
  async getJobById(@Param('id') id: string) {
    return this.jobService.getJobById(id)
  }
}
