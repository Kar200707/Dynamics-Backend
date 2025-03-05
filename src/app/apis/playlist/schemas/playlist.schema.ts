import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type PlaylistDocument = Playlist & Document;

@Schema({ collection: 'playlists' })
export class Playlist {
  @Prop()
  userId: string;

  @Prop()
  playlistName: string;

  @Prop()
  addedAt: number;

  @Prop()
  tracks: [
    {
      trackId: string;
      addedAt: number;
      title: string;
      author: {
        name: string;
        id: string;
      },
      image: string;
      videoId: string;
      track_duration: number;
      views: number;
      likes: number;
      description: string;
    }
  ]
}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist);