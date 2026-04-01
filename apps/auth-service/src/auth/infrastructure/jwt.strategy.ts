// apps/auth-service/src/auth/infrastructure/jwt.strategy.ts
//
// Passport JWT strategy — validates the Bearer token on every protected request
// and attaches the decoded payload to request.user.

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy }                  from '@nestjs/passport';
import { ExtractJwt, Strategy }             from 'passport-jwt';
import { ConfigService }                     from '@nestjs/config';

export interface JwtPayload {
  sub:         string;
  email:       string;
  role:        string;
  franchiseId: string;
  branchId?:   string;
  iat?:        number;
  exp?:        number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:      config.getOrThrow<string>('app.jwtSecret'),
    });
  }

  /** Called after signature verification — return value is attached to request.user */
  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub || !payload.role) {
      throw new UnauthorizedException('Malformed token');
    }
    return payload;
  }
}
