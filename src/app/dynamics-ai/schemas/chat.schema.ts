import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ChatDocument = Chat & Document;

@Schema({ collection: 'ai-chats' })
export class Chat {
  @Prop()
  userId: string;

  @Prop()
  at: number;

  @Prop()
  chat: [
    {
      at: number;
      role: "user" | "system" | "assistant";
      content: string;
    }
  ];
}

export const ChatsSchema = SchemaFactory.createForClass(Chat);