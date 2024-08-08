import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Track, TrackDocument } from '../media/schemas/track-details.schema';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import { DriveService } from '../../google/drive/drive.service';
import { DropboxStorageService } from '../../dropbox/dropbox-storage/dropbox-storage.service';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import mp3Duration from 'mp3-duration';

@Injectable()
export class AdminService {

  constructor(
    private driveService: DriveService,
    private dropBoxService: DropboxStorageService,
    @InjectModel(Track.name) private readonly Tracks: Model<TrackDocument>,
    @InjectModel(User.name) private readonly Users: Model<UserDocument>) { }

  async addTrack(trackDetails, access_token: string, track_file: Express.Multer.File, image_file: Express.Multer.File) {
    try {
      if (access_token !== '$2b$13$S8Cf8aEwAmwb70VdH5MUXuWA2QS6Lzq/z8ITwE74wv1HijpdTaxES') {
        throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
      }

      const duration = await mp3Duration(track_file.buffer);

      let track_image: string;

      if (image_file) {
        const fileExtension = extname(track_file.originalname).slice(1);
        const track_full_name:string = `${Date.now()}.${fileExtension}`;

        const response = await this.dropBoxService.uploadFile(
          track_full_name.toLowerCase(),
          image_file.buffer,
          '/images'
        );

        track_image = `http://localhost:8080/media/image/${ response.result.id }`;
      } else {
        track_image = trackDetails.track_image_url;
      }

      let track_id: string;

      if (track_file) {
        const fileExtension = extname(track_file.originalname).slice(1);
        const track_full_name:string = `${trackDetails.track_artist}-${trackDetails.track_name}.${fileExtension}`;

        const response = await this.dropBoxService.uploadFile(
          track_full_name.toLowerCase(),
          track_file.buffer,
          '/tracks'
        );

        track_id = response.result.id;
      }

      const sendTrackDetails = {
        track_name: trackDetails.track_name,
        track_artist: trackDetails.track_artist,
        track_image: track_image,
        track_sound_id: track_id,
        track_duration: duration,
        track_category: JSON.parse(trackDetails.track_category),
      };

      await this.Tracks.create(sendTrackDetails);

      return { message: 'track created' }
    } catch (error) {
      console.error(error);
      throw new HttpException('Incorrect request', HttpStatus.BAD_REQUEST);
    }
  }
}
