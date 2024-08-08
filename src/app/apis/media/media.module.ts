import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UsersSchema } from '../../auth/schemas/user.schema';
import { DriveService } from '../../google/drive/drive.service';
import { Track, TrackSchema } from './schemas/track-details.schema';
import { HttpModule, HttpService } from '@nestjs/axios';
import { DropboxStorageService } from '../../dropbox/dropbox-storage/dropbox-storage.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, DropboxStorageService, DriveService],
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UsersSchema,
      },
      {
        name: Track.name,
        schema: TrackSchema,
      }
    ])
  ]
})
export class MediaModule {}
