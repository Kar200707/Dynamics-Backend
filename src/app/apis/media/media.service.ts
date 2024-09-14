import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DriveService } from '../../google/drive/drive.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import { Model } from 'mongoose';
import { Track, TrackDocument } from './schemas/track-details.schema';
import { YoutubeBaseService } from '../youtube_base/youtube_base.service';
import { YoutubeDataService } from '../../google/youtube-data/youtube-data.service';
import { YTDL_VideoInfo } from '@ybd-project/ytdl-core/package/types/Ytdl';

@Injectable()
export class MediaService {

  constructor(
    @InjectModel(Track.name) private readonly Tracks: Model<TrackDocument>,
    @InjectModel(User.name) private readonly Users: Model<UserDocument>,
    private youtubeDataService: YoutubeDataService,
    private driveSerivce: DriveService) {  }

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
        console.log(trackId);
        const trackDetails:YTDL_VideoInfo = await this.youtubeDataService.getVideoDetailsById(trackId);
        const track = {
          title: trackDetails.videoDetails.title,
          author: {
            name: trackDetails.videoDetails.author.name
          },
          image: trackDetails.videoDetails.media.thumbnails[0].url,
          videoId: trackDetails.videoDetails.videoId,
          track_duration: trackDetails.videoDetails.lengthSeconds
        }
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

  async remFavoriteTracks(trackId: string, access_token: string) {
    const user = await this.Users.findOne({ userLocalToken: access_token });
    if (user.id && trackId) {
      if (!user) {
        throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
      }

      await this.Users.updateOne(
        { userLocalToken: access_token },
        { $pull: { trackFavorites: trackId } }
      );

      return { message: 'Track removed from favorites' };
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }
}
