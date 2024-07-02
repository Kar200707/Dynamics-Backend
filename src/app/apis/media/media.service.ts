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

  async getImage(fileId:string, res, req) {
    return await this.driveSerivce.getFile(fileId, res, req, 'image');
  }

  async getTrack(trackId: string, access_token: string, res, req) {
    // const user = await this.Users.findOne({ userLocalToken: access_token });
    //
    // if (user.id) {
    return await this.driveSerivce.getFile(trackId, res, req, 'audio');
    // } else {
    //   throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    // }
  }

  async getTrackByCategory (category: string, access_token: string) {
    if (!access_token) {
      throw new HttpException('Incorrect request', HttpStatus.BAD_REQUEST);
    }

    const user = await this.Users.findOne({ userLocalToken: access_token });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const tracksList = await this.Tracks.find({ track_category: { $in: [category] } });

    return tracksList
  }

  async isFavoriteTrack(trackId: string, access_token: string): Promise<{ isFavorite: boolean }> {
    if (!trackId || !access_token) {
      throw new HttpException('Incorrect request', HttpStatus.BAD_REQUEST);
    }

    const user = await this.Users.findOne({ userLocalToken: access_token });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const isFavorite = user.trackFavorites.some(id => id === trackId);

    return { isFavorite };
  }

  async getFavoriteTracksList(access_token: string) {
    const user = await this.Users.findOne({ userLocalToken: access_token });

    if (user.id) {

      const favoriteTrackList = [];

      await Promise.all(user.trackFavorites.map(async (trackId) => {
        const track = await this.Tracks.findOne({ _id: trackId });
        favoriteTrackList.push(track);
      }));

      return favoriteTrackList;
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }

  async addFavoriteTracks(trackId: string, access_token: string) {
    const user = await this.Users.findOne({ userLocalToken: access_token });
    if (user.id) {
      const addedUser = user.toObject();
      addedUser.trackFavorites.push(trackId);
      await this.Users.findOneAndUpdate({ userLocalToken: access_token }, addedUser);
      return { message: 'track in favorites has ben add' }
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }
}
