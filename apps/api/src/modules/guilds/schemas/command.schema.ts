import { type Model, type HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type ICommandModel } from '@workspace/types/api';
import { BaseDocument, BaseDocumentSchema } from 'database/base.schema';
import { type GuildDocument } from './guild.schema';

@Schema()
export class Command extends BaseDocument implements ICommandModel {
  @Prop({ required: true, unique: true })
  uid!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Guild', default: [] })
  guilds!: GuildDocument[];

  @Prop({ required: true, default: true })
  disabled!: boolean;
}

export type CommandDocumentOverride = {
  guilds: (Types.ObjectId | GuildDocument)[];
};

export type CommandDocument = HydratedDocument<Command, CommandDocumentOverride>;

export type CommandModel = Model<CommandDocument>;

export const CommandSchema = SchemaFactory.createForClass(Command);

CommandSchema.add(BaseDocumentSchema);
