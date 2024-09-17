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
    const url: string = `https://www.youtube.com/watch?v=${id}`;
    console.log(id);
    return await this.ytdl.getBasicInfo(url);
  }

  async getVideoSearchList(query: string): Promise<any> {
    try {
      const results = await ytSearch(query);
      return results.videos.slice(0, 7);
    } catch (error) {
      this.logger.error('Error searching YouTube:', error.message);
      throw new HttpException('Error searching YouTube', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async streamAudio(videoId: string, req: Request, res: Response) {
    const url: string = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      res.setHeader('Content-Type', 'audio/webm');
      res.setHeader('Connection', 'keep-alive');

      const videoStream = this.ytdl.download(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        }
      });

      const range = req.headers.range;
      if (range) {
        const [start, end] = range.replace(/bytes=/, "").split("-");
        const startByte = parseInt(start, 10);
        const endByte = end ? parseInt(end, 10) : undefined;

        videoStream.on('response', (response) => {
          const totalBytes = parseInt(response.headers['content-length'], 10);
          const chunkSize = (endByte !== undefined ? endByte - startByte + 1 : totalBytes - startByte);

          res.setHeader('Content-Range', `bytes ${startByte}-${endByte || (totalBytes - 1)}/${totalBytes}`);
          res.setHeader('Content-Length', chunkSize);
          res.status(HttpStatus.PARTIAL_CONTENT);

          videoStream.on('data', (chunk) => {
            res.write(chunk);
          });

          videoStream.on('end', () => {
            res.end();
          });

          videoStream.on('error', (error) => {
            this.logger.error('Error streaming audio:', error.message);
            res.status(500).send('Error streaming YouTube audio');
          });
        });
      } else {
        videoStream.on('data', (chunk) => {
          res.write(chunk);
        });

        videoStream.on('end', () => {
          res.end();
        });

        videoStream.on('error', (error) => {
          this.logger.error('Error streaming audio:', error.message);
          res.status(500).send('Error streaming YouTube audio');
        });
      }
    } catch (error) {
      this.logger.error(`Failed to stream audio: ${error.message}`);
      throw new HttpException(`Failed to stream audio: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}