import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { AuthGuard } from '../auth/guards/auth.guard'
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'
import { CreateChatDto } from './dto/create-chat.dto'
import { CreateProjectDto } from './dto/create-project.dto'
import { SendMessageDto } from './dto/send-message.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectsService } from './projects.service'

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async listProjects(@Req() req: Request & { user: AuthenticatedUser }) {
    return this.projectsService.listProjects(req.user.sub)
  }

  @Post()
  async createProject(
    @Req() req: Request & { user: AuthenticatedUser },
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.createProject(req.user.sub, dto)
  }

  @Get(':projectId')
  async getProject(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.getProject(req.user.sub, projectId)
  }

  @Patch(':projectId')
  async updateProject(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(req.user.sub, projectId, dto)
  }

  @Delete(':projectId')
  async deleteProject(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.deleteProject(req.user.sub, projectId)
  }

  @Get(':projectId/chats')
  async listChats(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.listChats(req.user.sub, projectId)
  }

  @Get(':projectId/chats/:chatId/messages')
  async listMessages(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('projectId') projectId: string,
    @Param('chatId') chatId: string,
  ) {
    return this.projectsService.listMessages(req.user.sub, projectId, chatId)
  }

  @Post(':projectId/chats')
  async createChat(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('projectId') projectId: string,
    @Body() dto: CreateChatDto,
  ) {
    return this.projectsService.createChat(req.user.sub, projectId, dto)
  }

  @Patch(':projectId/chats/:chatId')
  async updateChat(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('projectId') projectId: string,
    @Param('chatId') chatId: string,
    @Body() dto: Partial<CreateChatDto>,
  ) {
    return this.projectsService.updateChat(req.user.sub, projectId, chatId, dto)
  }

  @Delete(':projectId/chats/:chatId')
  async deleteChat(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('projectId') projectId: string,
    @Param('chatId') chatId: string,
  ) {
    return this.projectsService.deleteChat(req.user.sub, projectId, chatId)
  }

  @Post(':projectId/chats/:chatId/messages')
  async sendMessage(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('projectId') projectId: string,
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.projectsService.sendMessage(req.user.sub, projectId, chatId, dto)
  }
}
