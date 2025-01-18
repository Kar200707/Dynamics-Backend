import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DriveService } from '../../google/drive/drive.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import { Model } from 'mongoose';
import { Track, TrackDocument } from './schemas/track-details.schema';
import { YoutubeDataService } from '../../google/youtube-data/youtube-data.service';
import { YtdlCore } from '@ybd-project/ytdl-core';
import sharp from 'sharp';
import * as axios from 'axios';

@Injectable()
export class MediaService {
  ytdl: YtdlCore = new YtdlCore({
    gl: "AM",
    logDisplay: ['debug', 'error', 'info'],
    disableDefaultClients: true,
    clients: ['android', 'ios', 'mweb', 'tv', 'web', 'webEmbedded', 'webCreator', 'tvEmbedded'],
    noUpdate: true,
  });

  constructor(
    @InjectModel(Track.name) private readonly Tracks: Model<TrackDocument>,
    @InjectModel(User.name) private readonly Users: Model<UserDocument>,
    private youtubeDataService: YoutubeDataService,
    private driveService: DriveService) {  }

  async cropYtImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.default({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      const imageBuffer = Buffer.from(response.data);

      const croppedImage = await sharp(imageBuffer)
        .resize(500, 500, { fit: 'cover' })
        .toFormat('jpeg')
        .toBuffer();

      return croppedImage;
    } catch (error) {
      throw new HttpException('Failed to process image', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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

    const isFavorite = user.trackFavorites.some(track => track.videoId === trackId);

    return { isFavorite };
  }


  async getFavoriteTracksList(access_token: string) {
    
    const user = await this.Users.findOne({ userLocalToken: access_token });

    if (user && user.id) {
      // await Promise.all(user.trackFavorites.map(async (track) => {
      //   const trackDetails: any = await this.youtubeDataService.getVideoDetailsById(track.trackId);
      //   const trackData = {
      //     title: trackDetails.title,
      //     author: {
      //       name: trackDetails.author.name,
      //       id: trackDetails.author.id
      //     },
      //     image: trackDetails.thumbnails.at(-1).url,
      //     videoId: trackDetails.videoId,
      //     track_duration: trackDetails.lengthSeconds,
      //     addedAt: track.addedAt,
      //     views: trackDetails.viewCount,
      //     likes: trackDetails.likes,
      //     description: trackDetails.description,
      //   };
      //   int = 1;
      //   favoriteTrackList.push(trackData);
      // }));

      return user.trackFavorites;
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }

  async getHistoryTracks(access_token: string) {
    const user = await this.Users.findOne({ userLocalToken: access_token });

    if (user && user.id) {
      // await Promise.all(user.playHistory.map(async (track) => {
      //   const trackDetails: any = await this.youtubeDataService.getVideoDetailsById(track.trackId);
      //   const trackData = {
      //     title: trackDetails.title,
      //     author: {
      //       name: trackDetails.author.name,
      //       id: trackDetails.author.id
      //     },
      //     image: trackDetails.thumbnails.at(-1).url,
      //     videoId: trackDetails.videoId,
      //     track_duration: trackDetails.lengthSeconds,
      //     addedAt: track.addedAt,
      //     views: trackDetails.viewCount,
      //     likes: trackDetails.likes,
      //     description: trackDetails.description,
      //   };
      //   historyTrackList.push(trackData);
      // }));

      return user.playHistory;
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }

  async setPlayHistory(trackId: string, access_token: string) {
    if (!trackId || !access_token) {
      throw new HttpException('Invalid trackId or access_token', HttpStatus.BAD_REQUEST);
    }

    const user = await this.Users.findOne({ userLocalToken: access_token });
    if (user) {
      const addedUser: any = user.toObject();
      const trackDetails: any = await this.youtubeDataService.getVideoDetailsById(trackId);

      const existingIndex = addedUser.playHistory.findIndex(entry => entry.videoId === trackId);

      if (existingIndex !== -1) {
        addedUser.playHistory.splice(existingIndex, 1);
      }

      addedUser.playHistory.unshift({
        title: trackDetails.title,
        author: {
          name: trackDetails.author.name,
          id: trackDetails.author.id
        },
        image: trackDetails.thumbnails.at(-1).url,
        videoId: trackDetails.videoId,
        track_duration: trackDetails.lengthSeconds,
        addedAt: Date.now(),
        views: trackDetails.viewCount,
        likes: trackDetails.likes,
        description: trackDetails.description,
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
    if (!user) {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }

    const trackDetails: any = await this.youtubeDataService.getVideoDetailsById(trackId);
    const addedUser: any = user.toObject();

    const existingIndex = addedUser.trackFavorites.findIndex(entry => entry.videoId === trackId);

    if (existingIndex !== -1) {
      const [existingTrack] = addedUser.trackFavorites.splice(existingIndex, 1);
      addedUser.trackFavorites.unshift(existingTrack);
    } else {
      addedUser.trackFavorites.unshift({
        title: trackDetails.title,
        author: {
          name: trackDetails.author.name,
          id: trackDetails.author.id,
        },
        image: trackDetails.thumbnails.at(-1).url,
        videoId: trackDetails.videoId,
        track_duration: trackDetails.lengthSeconds,
        addedAt: Date.now(),
        views: trackDetails.viewCount,
        likes: trackDetails.likes,
        description: trackDetails.description,
      });
    }

    await this.Users.findOneAndUpdate({ userLocalToken: access_token }, { trackFavorites: addedUser.trackFavorites });

    return { message: 'Track added to favorites' };
  }


  async remFavoriteTracks(trackId: string, access_token: string) {
    const user = await this.Users.findOne({ userLocalToken: access_token });

    if (user && user.id && trackId) {
      await this.Users.updateOne(
        { userLocalToken: access_token },
        { $pull: { trackFavorites: { videoId: trackId } } }
      );

      return { message: 'Track removed from favorites' };
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }

  async getPlayerInfoByVideoId(trackId: string, access_token: string) {
    const user = await this.Users.findOne({ userLocalToken: access_token });
    if (user.id) {
      try {
        const result:any = await this.ytdl.getBasicInfo(trackId);
        const recTrackList = [];
        if (result.relatedVideos) {
          result.relatedVideos.slice(0, 10).map(async (track:any) => {
            const trackData = {
              title: track.title,
              author: {
                name: track.author.name,
                id: track.author.id
              },
              image: track.thumbnails.at(-1).url,
              videoId: track.id,
              track_duration: track.lengthSeconds,
              views: track.viewCount,
              likes: track.likes,
              description: null,
            };
            recTrackList.push(trackData);
          })

          return {
            title: result.videoDetails.title,
            author: {
              name: result.videoDetails.author?.name,
              id: result.videoDetails.author?.id
            },
            image: result.videoDetails.thumbnails?.at(-1).url,
            videoId: result.videoDetails.videoId,
            track_duration: result.videoDetails.lengthSeconds,
            description: result.videoDetails.description,
            likes: result.videoDetails.likes,
            views: result.videoDetails.viewCount,
            recTracks: recTrackList,
          };
        } else {
          return { message: 'Not Details' }
        }


      } catch (e) {
        console.log(e);
        throw new HttpException('', HttpStatus.INTERNAL_SERVER_ERROR)
      }
    } else {
      throw new HttpException('Access token invalid', HttpStatus.BAD_REQUEST);
    }
  }
}
