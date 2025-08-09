import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import type { DiscordAuthProfile } from '@workspace/types/api';

export type Done = (error: Error | null, profile: DiscordAuthProfile | null) => void;

@Injectable()
export class DiscordAuthSessionSerializer extends PassportSerializer {
  constructor() {
    super();
  }

  serializeUser(user: DiscordAuthProfile, done: Done): void {
    done(null, user);
  }

  deserializeUser(user: DiscordAuthProfile, done: Done) {
    done(null, user);
  }
}
