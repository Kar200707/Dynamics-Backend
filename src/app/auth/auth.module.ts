import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UsersSchema } from './schemas/user.schema';
import { DriveService } from '../google/drive/drive.service';
import { HttpModule } from '@nestjs/axios';
import { GoogleStrategy } from './google.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AuthController],
  providers: [AuthService, DriveService, GoogleStrategy, JwtService],
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UsersSchema
      }
    ]),
  ]
})
export class AuthModule {}
