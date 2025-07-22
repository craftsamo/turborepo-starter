import { IsString, IsNotEmpty } from 'class-validator';
import { type RESTPostAPILocalAuthRegisterJSON } from '@workspace/types/api';

export class RegisterLocalUserDto implements RESTPostAPILocalAuthRegisterJSON {
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
