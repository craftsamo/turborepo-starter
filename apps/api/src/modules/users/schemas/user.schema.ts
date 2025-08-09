import { type Model, type HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type IUserModel } from '@workspace/types/api';
import { BaseDocument, BaseDocumentSchema } from 'database/base.schema';

@Schema()
export class User extends BaseDocument implements IUserModel {
  @Prop({ required: true, unique: true })
  uid!: string;

  @Prop()
  discordId!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: true })
  username!: string;
}

export type UserDocument = HydratedDocument<User>;
export type UserModel = Model<UserDocument>;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.add(BaseDocumentSchema);
