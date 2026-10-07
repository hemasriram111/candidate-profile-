import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthGuard } from '../auth/guards/auth.guard'
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'
import { CandidateRoleGuard } from '../candidate/candidate-role.guard'
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/create-application.dto'
import { ApplicationService } from './application.service'

@Controller('applications')
@UseGuards(AuthGuard, CandidateRoleGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get()
  async listApplications(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.applicationService.listApplications(request.user.sub)
  }

  @Get(':id')
  async getApplication(
    @Param('id') id: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.applicationService.getApplication(request.user.sub, id)
  }

  @Post()
  async createApplication(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationService.createApplication(request.user.sub, dto)
  }

  @Patch(':id/status')
  async updateApplicationStatus(
    @Param('id') id: string,
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationService.updateApplicationStatus(request.user.sub, id, dto)
  }
}
