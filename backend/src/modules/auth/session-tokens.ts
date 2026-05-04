import type { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';

export type SessionSubject = {
  userId: string;
  email: string;
  activeRole: string;
  roles: string[];
  authSource?: string;
  externalId?: string;
};

export function mintAccessToken(
  jwtService: JwtService,
  config: ConfigService,
  s: SessionSubject,
): string {
  const secret = config.get<string>('jwt.secret');
  if (!secret) throw new Error('JWT_SECRET is not configured.');
  const expiresIn = config.get<string>('jwt.expiresIn') ?? '8h';
  return jwtService.sign(
    {
      id: s.userId,
      email: s.email,
      role: s.activeRole,
      roles: s.roles,
      authSource: s.authSource ?? 'local',
      externalId: s.externalId,
    },
    { secret, expiresIn },
  );
}

export function mintRefreshToken(
  jwtService: JwtService,
  config: ConfigService,
  s: Omit<SessionSubject, 'email'>,
): string {
  const refreshSecret =
    config.get<string>('jwt.refreshSecret') ?? config.get<string>('jwt.secret');
  if (!refreshSecret) throw new Error('JWT refresh signing secret is not configured.');
  const expiresIn = config.get<string>('jwt.refreshExpiresIn') ?? '30d';
  return jwtService.sign(
    {
      typ: 'refresh',
      id: s.userId,
      role: s.activeRole,
      roles: s.roles,
      authSource: s.authSource ?? 'local',
      externalId: s.externalId,
    },
    { secret: refreshSecret, expiresIn },
  );
}
