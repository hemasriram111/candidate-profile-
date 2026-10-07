import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SapAssistantClient } from './sap-assistant.client'
import { SapAssistantService } from './sap-assistant.service'

@Module({
  imports: [ConfigModule],
  providers: [SapAssistantClient, SapAssistantService],
  exports: [SapAssistantService],
})
export class SapAssistantModule {}
