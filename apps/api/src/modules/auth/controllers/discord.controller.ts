import type { Response, Request } from 'express';
import { Controller, Get, Post, Req, Res, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import type { DiscordAuthProfile } from '@workspace/types/api';
import { HttpExceptionFilter } from '../../../filters';
import { HttpResponseInterceptor } from '../../../interceptors';
import { DiscordAuthenticatedGuard, DiscordAuthGuard } from '../guards';

@UseFilters(HttpExceptionFilter)
@UseInterceptors(HttpResponseInterceptor)
@Controller('auth/discord')
export class DiscordAuthController {
  constructor() {}

  @Get('callback')
  @UseGuards(DiscordAuthGuard)
  callback(@Res() response: Response) {
    response.redirect('/login');
  }

  @Get('login')
  @UseGuards(DiscordAuthGuard)
  login() {}

  @Get('me')
  @UseGuards(DiscordAuthenticatedGuard)
  me(@Req() request: Request): DiscordAuthProfile | null {
    return request.user as DiscordAuthProfile;
  }

  @Post('logout')
  logout(@Req() request: Request): void {
    request.session.destroy(() => {});
  }
}
