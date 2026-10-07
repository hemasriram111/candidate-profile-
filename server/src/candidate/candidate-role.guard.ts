import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'

@Injectable()
export class CandidateRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>()
    if (request.user?.role.toUpperCase() !== 'CANDIDATE') {
      throw new ForbiddenException('Candidate access is required.')
    }
    return true
  }
}