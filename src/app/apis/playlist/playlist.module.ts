import { Module } from '@nestjs/common';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PlaylistSchema } from './schemas/playlist.schema';
import { Playlist } from 'youtubei';
import { User, UsersSchema } from '../../auth/schemas/user.schema';

@Module({
  controllers: [PlaylistController],
  providers: [PlaylistService],
  imports: [
    MongooseModule.forFeature([
      {
        schema: PlaylistSchema,
        name: Playlist.name,
      },
      {
        schema: UsersSchema,
        name: User.name
      }
    ])
  ]
})
export class PlaylistModule {}
