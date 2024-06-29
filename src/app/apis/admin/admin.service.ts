import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Track, TrackDocument } from '../media/schemas/track-details.schema';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import mp3Duration from 'mp3-duration';
import { DriveService } from '../../google/drive/drive.service';

@Injectable()
export class AdminService {

  constructor(
    private driveService: DriveService,
    @InjectModel(Track.name) private readonly Tracks: Model<TrackDocument>,
    @InjectModel(User.name) private readonly Users: Model<UserDocument>) { }

  async addTrack(trackDetails, access_token: string, track_file: Express.Multer.File, image_file: Express.Multer.File) {
    try {
      const user = await this.Users.findOne({ userLocalToken: access_token });

      if (!user) {
        throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
      }

      const duration = await mp3Duration(track_file.buffer);;

      let track_image: string;

      if (image_file) {
        const imageDetails = await this.driveService.uploadFile(image_file, '1xM12q3YXBqKy0aMrKj2pBie0TbiZwxXI');

        track_image = `https://api-dynamics.adaptable.app/media/image/${ imageDetails.id }`;
      } else {
        track_image = trackDetails.track_image;
      }

      let track_id: string;

      if (track_file) {
        const trackDetails = await this.driveService.uploadFile(image_file, '1jpr3et_SXXHrSpo8Dke0vlSKFQCj-SnW');

        track_id = trackDetails.id;
      }

      const sendTrackDetails = {
        track_name: trackDetails.track_name,
        track_artist: trackDetails.track_artist,
        track_image: track_image,
        track_sound_id: track_id,
        track_duration: duration,
        track_category: trackDetails.track_category,
      };

      await this.Tracks.create(sendTrackDetails);
    } catch (error) {
      console.error(error);
      throw new HttpException('Incorrect request', HttpStatus.BAD_REQUEST);
    }
  }
}
