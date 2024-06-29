import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DriveService } from '../../google/drive/drive.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import { Model } from 'mongoose';
import { Track, TrackDocument } from './schemas/track-details.schema';

@Injectable()
export class MediaService {

  constructor(
    @InjectModel(Track.name) private readonly Tracks: Model<TrackDocument>,
    @InjectModel(User.name) private readonly Users: Model<UserDocument>,
    private driveSerivce: DriveService) {  }

  async getImage(fileId:string, res) {
    return await this.driveSerivce.getFile(fileId, res, 'image');
  }

  async getTrack(trackId: string, access_token: string, res) {
    try {
      const user = await this.Users.findOne({ userLocalToken: access_token });

      if (user.id) {
        return await this.driveSerivce.getFile(trackId, res, 'audio');
      } else {
        throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException('incorrectly request', HttpStatus.BAD_REQUEST);
    }
  }

  async getTrackDetails(trackDetailsId: string, access_token: string) {
    try {
      const user = await this.Users.findOne({ userLocalToken: access_token });

      if (user.id) {
        return await this.Tracks.findOne({ id: trackDetailsId });
      } else {
        throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException('incorrectly request', HttpStatus.BAD_REQUEST);
    }
  }
}
