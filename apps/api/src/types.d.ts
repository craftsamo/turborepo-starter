import 'express';
import type { APIGuild } from '@workspace/types/api';

declare module 'express' {
  export interface Request {
    guild?: APIGuild;
  }
}
