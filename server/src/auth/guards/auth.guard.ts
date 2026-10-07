import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>()
    const token = req.cookies?.clyptus_session

    if (!token) {
      throw new UnauthorizedException('Authentication required.')
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthenticatedUser>(token)
      req.user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      }
      return true
    } catch {
      throw new UnauthorizedException('Authentication required.')
    }
  }
}
