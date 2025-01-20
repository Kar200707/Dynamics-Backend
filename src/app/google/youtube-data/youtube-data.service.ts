import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import ytSearch from 'yt-search';
import { Client } from 'youtubei';
import ytch from 'yt-channel-info';
import { toPipeableStream, YTDL_VideoInfo, YtdlCore } from '@ybd-project/ytdl-core';
import * as path from 'node:path';
import * as fs from 'node:fs';


@Injectable()
export class YoutubeDataService {
  private logger: Logger = new Logger(YoutubeDataService.name);
  private ytdl: YtdlCore = new YtdlCore({
    gl: "AM",
    logDisplay: ['debug', 'error', 'info'],
    disableDefaultClients: true,
    disableFileCache: true,
    disableBasicCache: true,
    clients: ['android', 'ios', 'mweb', 'tv', 'web', 'webEmbedded', 'webCreator', 'tvEmbedded'],
    noUpdate: true,
  });
  private youtubeInfo: Client = new Client();

  constructor() {}

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

  async clearYtdlCache() {
    const cacheDir:string = path.join(__dirname, '..', '..', '..', '..', 'node_modules', '@ybd-project', 'ytdl-core', 'bundle', '.CacheFiles');

    try {
      const files = fs.readdirSync(cacheDir);

      for (const file of files) {
        const filePath = path.join(cacheDir, file);
        if (fs.statSync(filePath).isFile()) {
          console.log(`Deleting file: ${filePath}`);
          fs.unlinkSync(filePath); // Удаляем файл
        }
      }

      console.log('Cache files deleted');
    } catch (err) {
      console.error('Error deleting cache files:', err);
    }
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
      await this.clearYtdlCache();
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
      const contentType = type === 'audio' ? 'audio/webm' : 'video/mp4';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Connection', 'keep-alive');

      const videoInfo: YTDL_VideoInfo = await this.ytdl.getFullInfo(url);

      const stream = await this.ytdl.downloadFromInfo(videoInfo, {
        filter: type.toLowerCase() === 'audio' ? "audioonly" : "videoandaudio",
        quality,
      });

      const totalSize = parseInt(videoInfo.formats[0].contentLength, 10);
      const range = req.headers.range;

      if (range) {
        const [start, end] = range.replace(/bytes=/, '').split('-');
        const startByte = parseInt(start, 10) || 0;
        const endByte = end ? parseInt(end, 10) : totalSize - 1;
        const chunkSize = endByte - startByte + 1;

        res.setHeader('Content-Range', `bytes ${startByte}-${endByte}/${totalSize}`);
        res.setHeader('Content-Length', chunkSize);
        res.status(HttpStatus.PARTIAL_CONTENT);

        toPipeableStream(stream).pipe(res);

        toPipeableStream(stream).on('end', () => {
          res.end();
        });

        toPipeableStream(stream).on('error', (err) => {
          console.error('Stream error:', err);
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error streaming data');
        });
      } else {
        toPipeableStream(stream).pipe(res);
      }
    } catch (error) {
      console.log(`Failed to stream ${type}: ${error.message}`);
      await this.clearYtdlCache();
      throw new HttpException(`Failed to stream ${type}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
