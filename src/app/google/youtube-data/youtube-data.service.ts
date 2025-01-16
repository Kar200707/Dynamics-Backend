import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import ytSearch from 'yt-search';
import { Client } from 'youtubei';
import ytch from 'yt-channel-info';
import { YtdlCore, toPipeableStream, YTDL_VideoInfo } from '@ybd-project/ytdl-core';
import { ytmp3 } from 'ruhend-scraper';

@Injectable()
export class YoutubeDataService {
  private logger: Logger = new Logger(YoutubeDataService.name);
  private ytdl: YtdlCore = new YtdlCore({
    disableInitialSetup: true,
    parsesHLSFormat: true,
    gl: "AM",
    noUpdate: true,
    logDisplay: ['warning', 'error', 'info'],
    disableDefaultClients: true,
    clients: ['android', 'ios', 'mweb', 'tv', 'web', 'webEmbedded', 'webCreator', 'tvEmbedded'],
    html5Player: {
      useRetrievedFunctionsFromGithub: true,
    },
  });
  private youtubeInfo: Client = new Client();

  constructor() {

  }

  async getChannelInfo(channelId: string): Promise<any> {
    try {
      const videos = ytch.getChannelVideos({
        channelId
      });
      const channelInfo = await this.youtubeInfo.getChannel(channelId);

      const info = {
        title: channelInfo.name,
        image: channelInfo.thumbnails[channelInfo.thumbnails.length - 1].url,
        videos: videos.items
      }
      return info;
    } catch (error) {
      console.log(error);
      throw new HttpException('id invalid', HttpStatus.BAD_REQUEST);
    }
  }

  async getAuthorIdByVideoId(id: string) {
    const url: string = `https://www.youtube.com/watch?v=${id}`;
    const details = await this.ytdl.getBasicInfo(url);
    return { authorId: details.videoDetails.author.id };
  }

  async getVideoDetailsById(id: string) {
    try {
      const url: string = `https://www.youtube.com/watch?v=${id}`;
      const info = await this.ytdl.getBasicInfo(url);
      // console.log(info.videoDetails);
      return info.videoDetails;
      // const url: string = `https://www.youtube.com/watch?v=${id}`;
      // const info = await this.ytdl.getBasicInfo(url);
      // return info.videoDetails;
    } catch (e) {
      console.log(e);
      throw new HttpException('id invalid', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getVideoSearchList(query: string): Promise<any> {
    try {
      const results = await ytSearch(query);
      return results.videos.slice(0, 10);
    } catch (error) {
      this.logger.error('Error searching YouTube:', error.message);
      throw new HttpException('Error searching YouTube', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async streamAudio(videoId: string, req: Request, res: Response, type: string, quality: string) {
    const validTypes = ['video', 'audio'];
    const validQualities = ['lowest', 'highest', 'highestaudio', 'lowestaudio', 'highestvideo', 'lowestvideo'];

    if (!validTypes.includes(type)) {
      throw new HttpException('Invalid type', HttpStatus.BAD_REQUEST);
    }

    if (!validQualities.includes(quality)) {
      throw new HttpException('Invalid quality', HttpStatus.BAD_REQUEST);
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      const data = await ytmp3(url);
      console.log(data);
      res.redirect(data.audio);
    } catch (error) {
      console.error(`Failed to stream ${type}: ${error.message}`);
      throw new HttpException(`Failed to stream ${type}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
