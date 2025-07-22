import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { IBaseModel } from '@workspace/types/api';

@Schema({ versionKey: '_version' })
export class BaseDocument extends Document implements IBaseModel {
  declare _id: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;

  declare _version: number;
}

export const BaseDocumentSchema = SchemaFactory.createForClass(BaseDocument);
