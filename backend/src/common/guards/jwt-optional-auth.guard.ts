import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard: validates token if present but does not reject when missing/invalid.
 * Use for public endpoints that behave differently when the user is logged in (e.g. product visibility).
 */
@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser | null {
    if (err || !user) return null;
    return user;
  }
}
