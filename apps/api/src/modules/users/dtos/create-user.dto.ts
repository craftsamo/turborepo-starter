import { IsString, IsNotEmpty } from 'class-validator';
import type { RESTPostAPIUserJSON } from '@workspace/types/api';

export class CreateUserDto implements RESTPostAPIUserJSON {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  discordId!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;
}
