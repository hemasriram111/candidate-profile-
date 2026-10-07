import { Injectable } from '@nestjs/common'
import { SapAssistantClient } from './sap-assistant.client'

@Injectable()
export class SapAssistantService {
  constructor(private readonly client: SapAssistantClient) {}

  async createChat(input: { clyptusUserId: string; title: string }) {
    return this.client.createChat(input)
  }

  async sendMessage(input: { clyptusUserId: string; sapChatId: string; content: string }) {
    return this.client.sendMessage(input)
  }
}
