import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './app/auth/auth.module';
import { UserModule } from './app/apis/user/user.module';
import { MediaModule } from './app/apis/media/media.module';
import { AdminModule } from './app/apis/admin/admin.module';
import { YoutubeDataService } from './app/google/youtube-data/youtube-data.service';
import { HttpModule } from '@nestjs/axios';
import { YoutubeBaseModule } from './app/apis/youtube_base/youtube_base.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DB_URI),

    //   controllers
    AuthModule,
    UserModule,
    MediaModule,
    AdminModule,
    YoutubeBaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, YoutubeDataService, HttpModule],
})
export class AppModule {}
