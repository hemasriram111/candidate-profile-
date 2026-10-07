import { Module } from '@nestjs/common'
import { AuthSessionModule } from '../auth/auth-session.module'
import { PrismaModule } from '../prisma/prisma.module'
import { SapAssistantModule } from '../sap-assistant/sap-assistant.module'
import { ProjectsController } from './projects.controller'
import { ChatsController } from './chats.controller'
import { ProjectsService } from './projects.service'

@Module({
  imports: [PrismaModule, AuthSessionModule, SapAssistantModule],
  controllers: [ProjectsController, ChatsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
