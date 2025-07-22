import { IsString, IsNotEmpty } from 'class-validator';
import { type RESTPostAPILocalAuthLoginJSON } from '@workspace/types/api';

export class LoginLocalDto implements RESTPostAPILocalAuthLoginJSON {
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
