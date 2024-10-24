import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DriveService } from '../../google/drive/drive.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import { Model } from 'mongoose';
import { Track, TrackDocument } from './schemas/track-details.schema';``
import { YoutubeDataService } from '../../google/youtube-data/youtube-data.service';

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

    const isFavorite = user.trackFavorites.some(track => track.trackId === trackId);

    return { isFavorite };
  }

  async getFavoriteTracksList(access_token: string) {
    const user = await this.Users.findOne({ userLocalToken: access_token });

    if (user) {
      const favoriteTrackList = [];

      await Promise.all(user.trackFavorites.map(async (track) => {
        return this.youtubeDataService.getVideoDetailsById(track.trackId).then(trackDetails => {
          if (trackDetails) {
            const trackData = {
              title: trackDetails.title,
              author: {
                name: trackDetails.author.name,
                id: trackDetails.author.id
              },
              image: trackDetails.thumbnails.slice(-1)[0].url,
              videoId: trackDetails.videoId,
              track_duration: trackDetails.lengthSeconds,
              addedAt: track.addedAt,
              views: trackDetails.viewCount,
              likes: 0,
              description: trackDetails.description,
            };
            favoriteTrackList.push(trackData);
          }
        })
      }));

      return favoriteTrackList;
    }

    return [];
  }

  async getHistoryTracks(access_token: string) {
    const user = await this.Users.findOne({ userLocalToken: access_token });

    if (user) {
      const historyTrackList = [];

      await Promise.all(user.playHistory.map(async (track) => {
        const trackDetails = await this.youtubeDataService.getVideoDetailsById(track.trackId);

        if (trackDetails) {
          const trackData = {
            title: trackDetails.title,
            author: {
              name: trackDetails.author.name,
              id: trackDetails.author.id
            },
            image: trackDetails.thumbnails.slice(-1)[0].url,
            videoId: trackDetails.videoId,
            track_duration: trackDetails.lengthSeconds,
            addedAt: track.addedAt,
            views: trackDetails.viewCount,
            likes: 0,
            description: trackDetails.description,
          };
          historyTrackList.push(trackData);
        }
      }));

      return historyTrackList;
    }

    return [];
  }

  async setPlayHistory(trackId: string, access_token: string) {
    if (!trackId || !access_token) {
      throw new HttpException('Invalid trackId or access_token', HttpStatus.BAD_REQUEST);
    }

    const user = await this.Users.findOne({ userLocalToken: access_token });
    if (user) {
      const addedUser: any = user.toObject();

      const existingIndex = addedUser.playHistory.findIndex(entry => entry.trackId === trackId);

      if (existingIndex !== -1) {
        addedUser.playHistory.splice(existingIndex, 1);
      }

      addedUser.playHistory.unshift({
        trackId: trackId,
        addedAt: Date.now()
      });

      if (addedUser.playHistory.length > 10) {
        addedUser.playHistory = addedUser.playHistory.slice(0, 10);
      }

      await this.Users.findOneAndUpdate(
        { userLocalToken: access_token },
        { playHistory: addedUser.playHistory }
      );

      return { message: 'Track added to history' };
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }

  async setSearchHistory(text: string, access_token: string) {
    if (!text || !access_token) {
      throw new HttpException('Invalid trackId or access_token', HttpStatus.BAD_REQUEST);
    }

    const user = await this.Users.findOne({ userLocalToken: access_token });
    if (user) {
      const addedUser: any = user.toObject();

      const existingIndex = addedUser.searchHistory.findIndex(entry => entry.text === text);

      if (existingIndex !== -1) {
        addedUser.searchHistory.splice(existingIndex, 1);
      }

      addedUser.searchHistory.unshift({
        text: text,
        addedAt: Date.now()
      });

      if (addedUser.searchHistory.length > 10) {
        addedUser.searchHistory = addedUser.searchHistory.slice(0, 10);
      }

      await this.Users.findOneAndUpdate(
        { userLocalToken: access_token },
        { searchHistory: addedUser.searchHistory }
      );

      return { message: 'search added to history' };
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }

  async getSearchHistory(access_token: string) {
    const user = await this.Users.findOne({ userLocalToken: access_token });

    if (user && user.id) {
      return user.searchHistory;
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }

  async addFavoriteTracks(trackId: string, access_token: string) {
    const user = await this.Users.findOne({ userLocalToken: access_token });
    if (user.id) {
      const addedUser = user.toObject();
      addedUser.trackFavorites.push({
        trackId: trackId,
        addedAt: Date.now()
      });
      await this.Users.findOneAndUpdate({ userLocalToken: access_token }, addedUser);
      return { message: 'track in favorites has ben add' }
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }

  async remFavoriteTracks(trackId: string, access_token: string) {
    const user = await this.Users.findOne({ userLocalToken: access_token });

    if (user && user.id && trackId) {
      await this.Users.updateOne(
        { userLocalToken: access_token },
        { $pull: { trackFavorites: { trackId: trackId } } }
      );

      return { message: 'Track removed from favorites' };
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }
}
