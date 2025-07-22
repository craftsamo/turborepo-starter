import { IsString, IsNotEmpty } from 'class-validator';
import type { RESTPatchAPIUserJSON } from '@workspace/types/api';

export class PatchUserDto implements RESTPatchAPIUserJSON {
  @IsString()
  @IsNotEmpty()
  username?: string;

  @IsString()
  @IsNotEmpty()
  email?: string;

  @IsString()
  @IsNotEmpty()
  password?: string;
}
