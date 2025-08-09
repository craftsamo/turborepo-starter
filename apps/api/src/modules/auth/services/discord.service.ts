import { Injectable } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import { UserDocument, UsersService } from '../../users';

@Injectable()
export class DiscordAuthService {
  constructor(private readonly usersService: UsersService) {}

  findUserByDiscordId(discordId: string): Promise<UserDocument | null> {
    return this.usersService.findOne({ discordId });
  }

  updateUser(discordId: string, displayName: string, username: string) {
    return this.usersService.updateOne({ discordId }, { displayName, username });
  }

  createUser(discordId: string, displayName: string, username: string): Promise<UserDocument[]> {
    return this.usersService.create([{ uid: uuidV4(), displayName, discordId, username }]);
  }
}
