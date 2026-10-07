import { BadGatewayException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface SapAssistantCitation {
  id?: string | null
  document: string
  page: number
  section?: string | null
  score: number
  snippet: string
}

export interface SapAssistantWebSource {
  id?: string | null
  title: string
  url: string
  domain: string
  snippet: string
}

export interface SapAssistantMessage {
  id: string
  chat_id: string
  role: 'assistant'
  content: string
  source_type: string | null
  grounding_score: number | null
  created_at: string
  citations: SapAssistantCitation[]
  web_sources: SapAssistantWebSource[]
}

interface SapIdentity {
  accessToken: string
  sapUserId: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseCitation(value: unknown): SapAssistantCitation {
  if (
    !isRecord(value)
    || typeof value.document !== 'string'
    || typeof value.page !== 'number'
    || typeof value.score !== 'number'
    || typeof value.snippet !== 'string'
    || (value.id !== undefined && value.id !== null && typeof value.id !== 'string')
    || (value.section !== undefined && value.section !== null && typeof value.section !== 'string')
  ) {
    throw new BadGatewayException('SAP Assistant is currently unavailable.')
  }

  return {
    ...(value.id === null || typeof value.id === 'string' ? { id: value.id } : {}),
    document: value.document,
    page: value.page,
    ...(value.section === null || typeof value.section === 'string' ? { section: value.section } : {}),
    score: value.score,
    snippet: value.snippet,
  }
}

function parseWebSource(value: unknown): SapAssistantWebSource {
  if (
    !isRecord(value)
    || typeof value.title !== 'string'
    || typeof value.url !== 'string'
    || typeof value.domain !== 'string'
    || typeof value.snippet !== 'string'
    || (value.id !== undefined && value.id !== null && typeof value.id !== 'string')
  ) {
    throw new BadGatewayException('SAP Assistant is currently unavailable.')
  }

  return {
    ...(value.id === null || typeof value.id === 'string' ? { id: value.id } : {}),
    title: value.title,
    url: value.url,
    domain: value.domain,
    snippet: value.snippet,
  }
}

@Injectable()
export class SapAssistantClient {
  constructor(private readonly configService: ConfigService) {}

  private getConfiguration() {
    const baseUrl = this.configService.get<string>('SAP_ASSISTANT_BASE_URL')?.trim()
    const integrationKey = this.configService.get<string>('SAP_ASSISTANT_INTEGRATION_KEY')?.trim()
    if (!baseUrl || !integrationKey) {
      throw new BadGatewayException('SAP Assistant is currently unavailable.')
    }

    return { baseUrl: baseUrl.replace(/\/+$/, ''), integrationKey }
  }

  private async request(
    path: string,
    options: { integrationKey: string; token?: string; body: unknown },
  ): Promise<unknown> {
    const { baseUrl } = this.getConfiguration()
    let response: Response
    try {
      response = await fetch(`${baseUrl}/api${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
          ...(!options.token ? { 'X-Integration-Key': options.integrationKey } : {}),
        },
        body: JSON.stringify(options.body),
        signal: AbortSignal.timeout(60_000),
      })
    } catch {
      throw new BadGatewayException('SAP Assistant is currently unavailable.')
    }

    if (!response.ok) {
      throw new BadGatewayException('SAP Assistant is currently unavailable.')
    }

    try {
      const value: unknown = await response.json()
      return value
    } catch {
      throw new BadGatewayException('SAP Assistant is currently unavailable.')
    }
  }

  private async ensureUser(clyptusUserId: string): Promise<SapIdentity> {
    const { integrationKey } = this.getConfiguration()
    const result = await this.request('/integration/users/ensure', {
      integrationKey,
      body: { external_user_id: clyptusUserId },
    })

    if (
      !isRecord(result)
      || typeof result.access_token !== 'string'
      || !isRecord(result.user)
      || typeof result.user.id !== 'string'
      || !result.access_token
      || !result.user.id
    ) {
      throw new BadGatewayException('SAP Assistant is currently unavailable.')
    }

    return { accessToken: result.access_token, sapUserId: result.user.id }
  }

  async createChat(input: { clyptusUserId: string; title: string }) {
    const { integrationKey } = this.getConfiguration()
    const identity = await this.ensureUser(input.clyptusUserId)
    const result = await this.request('/chats', {
      integrationKey,
      token: identity.accessToken,
      body: { title: input.title },
    })

    if (!isRecord(result) || typeof result.id !== 'string' || !result.id) {
      throw new BadGatewayException('SAP Assistant is currently unavailable.')
    }

    return { sapChatId: result.id, sapUserId: identity.sapUserId }
  }

  async sendMessage(input: { clyptusUserId: string; sapChatId: string; content: string }) {
    const { integrationKey } = this.getConfiguration()
    const identity = await this.ensureUser(input.clyptusUserId)
    const result = await this.request(`/chats/${encodeURIComponent(input.sapChatId)}/messages`, {
      integrationKey,
      token: identity.accessToken,
      body: { content: input.content },
    })

    if (
      !isRecord(result)
      || typeof result.id !== 'string'
      || result.chat_id !== input.sapChatId
      || result.role !== 'assistant'
      || typeof result.content !== 'string'
      || !result.content.trim()
      || (result.source_type !== null && typeof result.source_type !== 'string')
      || (result.grounding_score !== null && typeof result.grounding_score !== 'number')
      || typeof result.created_at !== 'string'
      || Number.isNaN(Date.parse(result.created_at))
      || !Array.isArray(result.citations)
      || !Array.isArray(result.web_sources)
    ) {
      throw new BadGatewayException('SAP Assistant is currently unavailable.')
    }

    return {
      sapUserId: identity.sapUserId,
      message: {
        id: result.id,
        chat_id: result.chat_id,
        role: 'assistant',
        content: result.content,
        source_type: result.source_type,
        grounding_score: result.grounding_score,
        created_at: result.created_at,
        citations: result.citations.map(parseCitation),
        web_sources: result.web_sources.map(parseWebSource),
      } satisfies SapAssistantMessage,
    }
  }
}
