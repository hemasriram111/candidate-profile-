import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthGuard } from '../auth/guards/auth.guard'
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'
import { CandidateRoleGuard } from '../candidate/candidate-role.guard'
import { InterviewService } from './interview.service'

@Controller('interviews')
@UseGuards(AuthGuard, CandidateRoleGuard)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Get()
  async listInterviews(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.interviewService.listInterviews(request.user.sub)
  }

  @Get(':id')
  async getInterview(
    @Param('id') id: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.interviewService.getInterview(request.user.sub, id)
  }
}
