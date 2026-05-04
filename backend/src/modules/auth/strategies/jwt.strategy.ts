import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  roles?: string[];
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? '',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userModel
      .findById(payload.id)
      .exec();
    if (!user) {
      throw new UnauthorizedException('The user belonging to this token no longer exists.');
    }
    if (user.status !== 'active') {
      throw new UnauthorizedException('Your account has been deactivated.');
    }
    const u = user as UserDocument & { passwordChangedAt?: Date; lockUntil?: Date };
    if (u.passwordChangedAt && payload.iat) {
      const changedTimestamp = Math.floor(u.passwordChangedAt.getTime() / 1000);
      if (payload.iat < changedTimestamp) {
        throw new UnauthorizedException('User recently changed password! Please log in again.');
      }
    }
    if (u.lockUntil && u.lockUntil > new Date()) {
      throw new UnauthorizedException('Your account has been temporarily locked.');
    }
    // Set the role on the user document to match the active session role from the JWT payload
    if (payload.role) {
      user.role = payload.role;
    }
    return user;
  }
}
