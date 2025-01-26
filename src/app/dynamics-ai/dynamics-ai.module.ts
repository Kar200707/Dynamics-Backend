import { Module } from '@nestjs/common';
import { DynamicsAiService } from './dynamics-ai.service';
import { DynamicsAiController } from './dynamics-ai.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UsersSchema } from '../auth/schemas/user.schema';
import { Chat, ChatsSchema } from './schemas/chat.schema';

@Module({
  controllers: [DynamicsAiController],
  providers: [DynamicsAiService],
  imports: [
    MongooseModule.forFeature([
      {
        schema: UsersSchema,
        name: User.name
      },
      {
        schema: ChatsSchema,
        name: Chat.name
      }
    ])
  ]
})
export class DynamicsAiModule {}
