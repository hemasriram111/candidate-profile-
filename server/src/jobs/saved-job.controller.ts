import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthGuard } from '../auth/guards/auth.guard'
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'
import { CandidateRoleGuard } from '../candidate/candidate-role.guard'
import { SavedJobService } from './saved-job.service'

@Controller('candidate/saved-jobs')
@UseGuards(AuthGuard, CandidateRoleGuard)
export class SavedJobController {
  constructor(private readonly savedJobService: SavedJobService) {}

  @Get()
  async listSavedJobs(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.savedJobService.listSavedJobs(request.user.sub)
  }

  @Post(':jobId')
  async saveJob(
    @Param('jobId') jobId: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.savedJobService.saveJob(request.user.sub, jobId)
  }

  @Delete(':jobId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSavedJob(
    @Param('jobId') jobId: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    await this.savedJobService.removeSavedJob(request.user.sub, jobId)
  }
}
