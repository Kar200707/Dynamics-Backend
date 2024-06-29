import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UsersSchema } from '../../auth/schemas/user.schema';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UsersSchema,
      }
    ])
  ]
})
export class UserModule {}
