import { Controller, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthGuard } from '../auth/guards/auth.guard'
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'
import { CandidateRoleGuard } from '../candidate/candidate-role.guard'
import { DemoService } from './demo.service'

@Controller('demo')
@UseGuards(AuthGuard, CandidateRoleGuard)
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post('seed')
  async seedDemoData(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.demoService.seedDemoData(request.user.sub)
  }
}
