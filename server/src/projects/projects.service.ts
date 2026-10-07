import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { SapAssistantService } from '../sap-assistant/sap-assistant.service'
import { CreateChatDto } from './dto/create-chat.dto'
import { CreateProjectDto } from './dto/create-project.dto'
import { SendMessageDto } from './dto/send-message.dto'
import { UpdateProjectDto } from './dto/update-project.dto'

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sapAssistantService: SapAssistantService,
  ) {}

  private serializeProject(project: { id: string; name: string; description: string | null; createdAt: Date; updatedAt: Date; isPinned: boolean }) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      isPinned: project.isPinned,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
  }

  private serializeChat(chat: { id: string; projectId: string; title: string; sapChatId: string | null; createdAt: Date; updatedAt: Date; isPinned: boolean }) {
    return {
      id: chat.id,
      projectId: chat.projectId,
      title: chat.title,
      sapChatId: chat.sapChatId,
      isPinned: chat.isPinned,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }
  }

  private async getProjectForUser(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project.')
    }

    return project
  }

  private async getChatForProject(userId: string, projectId: string, chatId: string) {
    const project = await this.getProjectForUser(userId, projectId)

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    })

    if (!chat) {
      throw new NotFoundException('Chat not found.')
    }

    if (chat.projectId !== project.id) {
      throw new ForbiddenException('You do not have access to this chat.')
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('You do not have access to this chat.')
    }

    return { project, chat }
  }

  async listProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    return projects.map((project) => this.serializeProject(project))
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    const name = dto.name?.trim()
    if (!name) {
      throw new BadRequestException('Project name is required.')
    }

    const project = await this.prisma.project.create({
      data: {
        userId,
        name,
        description: dto.description?.trim() || null,
      },
    })

    return this.serializeProject(project)
  }

  async getProject(userId: string, projectId: string) {
    const project = await this.getProjectForUser(userId, projectId)
    return this.serializeProject(project)
  }

  async updateProject(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.getProjectForUser(userId, projectId)
    const name = dto.name?.trim()
    const description = dto.description?.trim()

    const updatedProject = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
      },
    })

    return this.serializeProject(updatedProject)
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await this.getProjectForUser(userId, projectId)
    await this.prisma.project.delete({ where: { id: project.id } })

    return {
      success: true,
      projectId: project.id,
    }
  }

  async listChats(userId: string, projectId: string) {
    await this.getProjectForUser(userId, projectId)

    const chats = await this.prisma.chat.findMany({
      where: { projectId, userId },
      orderBy: { updatedAt: 'desc' },
    })

    return chats.map((chat) => this.serializeChat(chat))
  }

  async listAllChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    return chats.map((chat) => this.serializeChat(chat))
  }

  async listMessages(userId: string, projectId: string, chatId: string) {
    await this.getChatForProject(userId, projectId, chatId)

    const messages = await this.prisma.message.findMany({
      where: { userId, chatId },
      orderBy: { createdAt: 'asc' },
    })

    return messages.map((message) => ({
      id: message.id,
      chatId: message.chatId,
      role: message.role,
      content: message.content,
      sourceType: message.sourceType,
      groundingScore: message.groundingScore,
      citations: message.citations ?? [],
      webSources: message.webSources ?? [],
      sapMessageId: message.sapMessageId,
      createdAt: message.createdAt,
    }))
  }

  async createChat(userId: string, projectId: string, dto: CreateChatDto) {
    await this.getProjectForUser(userId, projectId)

    const title = dto.title?.trim() || 'New chat'
    const sapChat = await this.sapAssistantService.createChat({
      clyptusUserId: userId,
      title,
    })
    await this.saveSapUserMapping(userId, sapChat.sapUserId)

    const chat = await this.prisma.chat.create({
      data: {
        userId,
        projectId,
        title,
        sapChatId: sapChat.sapChatId,
      },
    })

    return this.serializeChat(chat)
  }

  private async saveSapUserMapping(userId: string, sapUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { sapUserId: true },
    })
    if (!user) {
      throw new NotFoundException('User not found.')
    }

    if (user.sapUserId && user.sapUserId !== sapUserId) {
      throw new BadGatewayException('SAP Assistant is currently unavailable.')
    }

    if (!user.sapUserId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { sapUserId },
      })
    }
  }

  async updateChat(userId: string, projectId: string, chatId: string, dto: Partial<CreateChatDto>) {
    const { chat } = await this.getChatForProject(userId, projectId, chatId)
    const title = dto.title?.trim()

    if (!title) {
      return this.serializeChat(chat)
    }

    const updatedChat = await this.prisma.chat.update({
      where: { id: chat.id },
      data: { title },
    })

    return this.serializeChat(updatedChat)
  }

  async deleteChat(userId: string, projectId: string, chatId: string) {
    const { chat } = await this.getChatForProject(userId, projectId, chatId)
    await this.prisma.chat.delete({ where: { id: chat.id } })

    return {
      success: true,
      chatId: chat.id,
    }
  }

  async sendMessage(userId: string, projectId: string, chatId: string, dto: SendMessageDto) {
    const { chat } = await this.getChatForProject(userId, projectId, chatId)
    const content = dto.content?.trim()

    if (!content) {
      throw new BadRequestException('Message content is required.')
    }

    const userMessage = await this.prisma.message.create({
      data: {
        chatId: chat.id,
        userId,
        role: 'USER',
        content,
      },
    })

    let sapChatId = chat.sapChatId
    if (!sapChatId) {
      const sapChat = await this.sapAssistantService.createChat({
        clyptusUserId: userId,
        title: chat.title,
      })
      sapChatId = sapChat.sapChatId
      await this.saveSapUserMapping(userId, sapChat.sapUserId)
      await this.prisma.chat.update({
        where: { id: chat.id },
        data: { sapChatId },
      })
    }

    const sapResponse = await this.sapAssistantService.sendMessage({
      content,
      sapChatId,
      clyptusUserId: userId,
    })
    await this.saveSapUserMapping(userId, sapResponse.sapUserId)
    const response = sapResponse.message
    const citations: Prisma.InputJsonArray = response.citations.map((citation) => ({
      ...(citation.id !== undefined ? { id: citation.id } : {}),
      document: citation.document,
      page: citation.page,
      ...(citation.section !== undefined ? { section: citation.section } : {}),
      score: citation.score,
      snippet: citation.snippet,
    }))
    const webSources: Prisma.InputJsonArray = response.web_sources.map((source) => ({
      ...(source.id !== undefined ? { id: source.id } : {}),
      title: source.title,
      url: source.url,
      domain: source.domain,
      snippet: source.snippet,
    }))

    const assistantMessage = await this.prisma.message.create({
      data: {
        chatId: chat.id,
        userId,
        role: 'ASSISTANT',
        content: response.content,
        sourceType: response.source_type,
        groundingScore: response.grounding_score,
        citations,
        webSources,
        sapMessageId: response.id,
        createdAt: new Date(response.created_at),
      },
    })

    await this.prisma.chat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() },
    })

    return {
      answer: response.content,
      sourceType: response.source_type,
      groundingScore: response.grounding_score,
      citations: response.citations,
      webSources: response.web_sources,
      chatId: chat.id,
      sapChatId,
      messageId: assistantMessage.id,
      sapMessageId: response.id,
      userMessageId: userMessage.id,
      createdAt: assistantMessage.createdAt,
    }
  }
}
