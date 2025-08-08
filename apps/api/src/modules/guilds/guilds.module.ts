import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuildsController, RolesController } from './controllers';
import { GuildsRepository, RolesRepository, CommandsRepository } from './repositories';
import { Guild, GuildSchema, Role, RoleSchema, Command, CommandSchema } from './schemas';
import { GuildsService, RolesService, CommandsService } from './services';
import { ValidGuildGuard } from './guards';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Guild.name, schema: GuildSchema }], 'discord'),
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }], 'discord'),
    MongooseModule.forFeature([{ name: Command.name, schema: CommandSchema }], 'discord'),
  ],
  providers: [
    GuildsService,
    GuildsRepository,
    RolesService,
    RolesRepository,
    CommandsRepository,
    CommandsService,
    ValidGuildGuard,
  ],
  controllers: [GuildsController, RolesController],
  exports: [GuildsService, RolesService, CommandsService, ValidGuildGuard],
})
export class GuildsModule {}
