import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UsersSchema } from '../../auth/schemas/user.schema';
import { Track, TrackSchema } from '../media/schemas/track-details.schema';
import { DriveService } from '../../google/drive/drive.service';
import { HttpModule } from '@nestjs/axios';
import { DropboxStorageService } from '../../dropbox/dropbox-storage/dropbox-storage.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, DropboxStorageService, DriveService],
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
export class AdminModule {}
