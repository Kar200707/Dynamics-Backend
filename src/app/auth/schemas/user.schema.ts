import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'users' })
export class User {
  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  bio: string;

  @Prop()
  password: string;

  @Prop()
  avatar: string;

  @Prop()
  devicesId: string[];

  @Prop()
  trackFavorites: string[];

  @Prop()
  artistFavorites: string[];

  @Prop()
  playlistFavorites: string[];

  @Prop()
  userLocalToken: string;
}

export const UsersSchema = SchemaFactory.createForClass(User);