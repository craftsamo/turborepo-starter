import { type Model, type HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { IRoleModel } from '@workspace/types/api';
import { BaseDocument, BaseDocumentSchema } from 'database/base.schema';
import { type GuildDocument } from './guild.schema';

@Schema()
export class Role extends BaseDocument implements IRoleModel {
  @Prop({ type: String, required: true, unique: true })
  uid!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String })
  icon?: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Guild' })
  guild!: GuildDocument;
}

export type RoleDocumentOverride = {
  guild: Types.ObjectId | GuildDocument;
};

export type RoleDocument = HydratedDocument<Role, RoleDocumentOverride>;

export type RoleModel = Model<RoleDocument>;

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.add(BaseDocumentSchema);
