import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type TrackDocument = Track & Document;

@Schema({ collection: 'track' })
export class Track {
  @Prop()
  track_name: string;

  @Prop()
  track_artist: string;

  @Prop()
  track_image: string;

  @Prop()
  track_sound_id: string;

  @Prop()
  track_duration: string;

  @Prop()
  artist_id?: string;

  @Prop()
  track_category?: string;
}

export const TrackSchema = SchemaFactory.createForClass(Track);