import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Env } from '../env.model';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as User;
    const tokenObj = this.authService.generateToken(user);
    const tokenExpiration =
      this.configService.get('TOKEN_EXPIRATION') ?? '6d';
    const cookieOptions = this.getAuthCookieOptions();

    res.cookie('JWT_TOKEN', tokenObj.access_token, {
      ...cookieOptions,
      maxAge: this.durationToMilliseconds(tokenExpiration),
    });

    return {
      user,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('JWT_TOKEN', this.getAuthCookieOptions());

    return {
      message: 'Logout successful',
    };
  }

  private getAuthCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    };
  }

  private durationToMilliseconds(duration: string): number {
    const match = duration.trim().match(/^(\d+)(ms|s|m|h|d)$/i);

    if (!match) {
      throw new Error(
        'Invalid token duration format. Use values like 4h, 30m, 3600s or 5000ms.',
      );
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }
}
