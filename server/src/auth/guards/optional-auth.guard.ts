import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface'

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>()
    const token = request.cookies?.clyptus_session
    if (!token) return true

    try {
      const payload = await this.jwtService.verifyAsync<AuthenticatedUser>(token)
      request.user = { sub: payload.sub, email: payload.email, role: payload.role }
      return true
    } catch {
      throw new UnauthorizedException('Authentication required.')
    }
  }
}
