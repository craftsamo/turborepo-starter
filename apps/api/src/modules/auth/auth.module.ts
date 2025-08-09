import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users';
import { DiscordAuthController } from './controllers';
import { DiscordAuthService } from './services';
import { DiscordAuthSessionSerializer } from './session-serializers';
import { DiscordStrategy } from './strategies';

@Module({
  imports: [UsersModule, PassportModule],
  controllers: [DiscordAuthController],
  providers: [DiscordAuthService, DiscordStrategy, DiscordAuthSessionSerializer],
  exports: [DiscordAuthService],
})
export class AuthModule {}
