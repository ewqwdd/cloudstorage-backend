import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      secretOrKey: process.env.REFRESH_SECRET_KEY,
    });
  }

  validate(req: Request['headers'], payload: any) {
    console.log(payload);
    return {
      ...payload,
      refreshToken: req.get('authorization').split(' ')[1],
    };
  }
}
