import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { YtdlCore } from '@ybd-project/ytdl-core';
import { Request, Response } from 'express';
import ytSearch from 'yt-search';

@Injectable()
export class YoutubeDataService {
  private logger: Logger = new Logger(YoutubeDataService.name);
  private ytdl: YtdlCore;

  constructor() {
    this.ytdl = new YtdlCore();
  }

  async getVideoList(query: string): Promise<any> {
    try {
      const results = await ytSearch(query);
      return results.videos.slice(0, 5);
    } catch (error) {
      this.logger.error('Error searching YouTube:', error.message);
      throw new HttpException('Error searching YouTube', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async streamAudio(videoId: string, req: Request, res: Response) {
    const url: string = `https://www.youtube.com/watch?v=${videoId}`;

    try {
       res.setHeader('Content-Type', 'audio/mpeg');

      const chunks: Buffer[] = [];

      const videoReadableStream = this.ytdl.download(url, {
        filter: 'audioandvideo',
        quality: 'highestaudio'
      });

      videoReadableStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      videoReadableStream.on('end', () => {
        const buffer = Buffer.concat(chunks);

        res.end(buffer);
      });

      videoReadableStream.on('error', (error) => {
        this.logger.error('Error streaming audio:', error.message);
        res.status(500).send('Error streaming YouTube audio');
      });

    } catch (error) {
      this.logger.error(`Failed to stream audio: ${error.message}`);
      throw new HttpException(`Failed to stream audio: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}