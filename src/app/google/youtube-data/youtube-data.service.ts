import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { YtdlCore } from '@ybd-project/ytdl-core';
import { Request, Response } from 'express';
import ytSearch from 'yt-search';
import { Client } from 'youtubei';
import ytch from 'yt-channel-info';

@Injectable()
export class YoutubeDataService {
  private logger: Logger = new Logger(YoutubeDataService.name);
  private ytdl: YtdlCore;
  private youtubeInfo: Client = new Client();

  constructor() {
    this.ytdl = new YtdlCore();
  }

  async getChannelInfo(channelId: string): Promise<any> {
    try {
      const videos = await ytch.getChannelVideos({
        channelId,
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
    const url: string = `https://www.youtube.com/watch?v=${id}`;
    return await this.ytdl.getBasicInfo(url)
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
    const validQualities = [
      'lowest',
      'highest',
      'highestaudio',
      'lowestaudio',
      'highestvideo',
      'lowestvideo',
    ];

    if (!validTypes.includes(type)) {
      throw new HttpException('Invalid type', HttpStatus.BAD_REQUEST);
    }
    if (!validQualities.includes(quality)) {
      throw new HttpException('Invalid quality', HttpStatus.BAD_REQUEST);
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      res.setHeader('Content-Type', type === 'audio' ? 'audio/webm' : 'video/mp4');
      res.setHeader('Connection', 'keep-alive');

      const videoStream = this.ytdl.download(url, {
        filter: type === 'audio' ? 'audioonly' : 'videoandaudio',
        quality: 'highestaudio',
      });

      const range = req.headers.range;
      if (range) {
        const [start, end] = range.replace(/bytes=/, "").split("-");
        const startByte = parseInt(start, 10);
        let endByte = end ? parseInt(end, 10) : undefined;

        videoStream.on('response', (response) => {
          const totalBytes = parseInt(response.headers['content-length'], 10);
          const chunkSize = (endByte !== undefined ? endByte - startByte + 1 : totalBytes - startByte);

          res.setHeader('Content-Range', `bytes ${startByte}-${endByte || (totalBytes - 1)}/${totalBytes}`);
          res.setHeader('Content-Length', chunkSize);
          res.status(HttpStatus.PARTIAL_CONTENT);

          videoStream.pipe(res);

          videoStream.on('error', (error) => {
            this.logger.error('Error streaming audio:', error.message);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error streaming YouTube audio');
          });
        });
      } else {
        videoStream.pipe(res);
        videoStream.on('error', (error) => {
          this.logger.error('Error streaming audio:', error.message);
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error streaming YouTube audio');
        });
      }
    } catch (error) {
      this.logger.error(`Failed to stream ${type}: ${error.message}`);
      throw new HttpException(`Failed to stream ${type}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
