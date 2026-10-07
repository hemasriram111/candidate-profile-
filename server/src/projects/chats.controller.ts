import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthGuard } from '../auth/guards/auth.guard'
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'
import { ProjectsService } from './projects.service'

@Controller('chats')
@UseGuards(AuthGuard)
export class ChatsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async listChats(@Req() req: Request & { user: AuthenticatedUser }) {
    return this.projectsService.listAllChats(req.user.sub)
  }
}
