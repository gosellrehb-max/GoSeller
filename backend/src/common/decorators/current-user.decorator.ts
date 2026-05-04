import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  /** Persisted grants when attached by strategies/controllers */
  roles?: string[];
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload & { _id?: string; userId?: string };
    if (!user) return null;
    if (data) return user[data];
    return user;
  },
);
