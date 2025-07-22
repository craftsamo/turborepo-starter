import { Body, Controller, Param, Patch, UseFilters, UseInterceptors } from '@nestjs/common';
import { type APIUser } from '@workspace/types/api';
import { HttpExceptionFilter } from '../../../filters';
import { HttpResponseInterceptor } from '../../../interceptors';
import { UserNotFoundException } from '../../../exceptions';
import { UsersService } from '../services';
import { PatchUserDto } from '../dtos';

@UseFilters(HttpExceptionFilter)
@UseInterceptors(HttpResponseInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':uid')
  async patchOne(@Param() uid: string, @Body() body: PatchUserDto): Promise<APIUser> {
    const user = await this.usersService.findOneByUid(uid);
    if (!user) throw new UserNotFoundException(uid);
    const newUser = await this.usersService.findOneAndUpdate({ uid }, { $set: body });
    return this.usersService.toAPIUser(newUser!);
  }
}
