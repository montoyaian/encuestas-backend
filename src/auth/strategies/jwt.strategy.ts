import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import type { Env } from '../../env.model';
import { ConfigService } from '@nestjs/config';
import { Payload } from '../models/payload.model';
import type { Request } from 'express';

const extractJwtFromCookie = (req: Request): string | null => {
  if (!req?.cookies) {
    return null;
  }

  return req.cookies.JWT_TOKEN ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractJwtFromCookie]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET', { infer: true }),
    });
  }

  async validate(payload: Payload) {
    return payload;
  }
}
