import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

@Injectable()
export class EmailService {
  private readonly resend?: Resend

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY')
    if (apiKey) {
      this.resend = new Resend(apiKey)
    }
  }

  async sendVerificationEmail({ email, name, otp }: { email: string; name: string; otp: string }) {
    const from = this.configService.get<string>('EMAIL_FROM')
    if (!this.resend || !from) {
      throw new ServiceUnavailableException('Email verification is not configured. Please try again later.')
    }

    const safeName = this.escapeHtml(name || 'there')

    try {
      const { error } = await this.resend.emails.send({
        from,
        to: email,
        subject: 'Verify your Clyptus email address',
        html: `
          <div style="margin:0;background:#f7f7f5;padding:36px 16px;font-family:Arial,sans-serif;color:#24231f">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e8e6e1;border-radius:12px;overflow:hidden">
              <div style="background:#171614;padding:22px 32px;color:#ffffff;font-size:22px;font-weight:700">Clyptus</div>
              <div style="padding:32px">
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3">Verify your email address</h1>
                <p style="margin:0 0 20px;line-height:1.6">Hi ${safeName}, enter this code in Clyptus to finish creating your candidate account:</p>
                <div style="margin:24px 0;padding:18px;text-align:center;background:#fff6ed;border:1px solid #f2d7bd;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#9a4f16">${otp}</div>
                <p style="margin:0 0 12px;line-height:1.6">This code expires in 10 minutes.</p>
                <p style="margin:0;color:#68665f;font-size:13px;line-height:1.6">If you did not create a Clyptus account, you can ignore this email.</p>
              </div>
            </div>
          </div>
        `,
      })

      if (error) {
        throw new Error('Email provider rejected the message.')
      }
    } catch {
      throw new ServiceUnavailableException('We could not send the verification email. Please try again later.')
    }
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }
      return entities[character]
    })
  }
}