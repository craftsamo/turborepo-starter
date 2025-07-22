import { IsString, IsNotEmpty } from 'class-validator';
import type { RESTPostAPIUserJSON } from '@workspace/types/api';

export class CreateUserDto implements RESTPostAPIUserJSON {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
