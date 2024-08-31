import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { google, youtube_v3 } from 'googleapis';
import ytdl from '@distube/ytdl-core';
import ytSearch from 'yt-search';

@Injectable()
export class YoutubeDataService {
  private logger:Logger = new Logger(YoutubeDataService.name);

  constructor() {}

  async getVideoList(query: string): Promise<any> {
    try {
      const results = await ytSearch(query);
      return results.videos.slice(0, 5);
    } catch (error) {
      this.logger.error('Error searching YouTube:', error.message);
      throw new HttpException('Error searching YouTube', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async streamAudio(videoId: string): Promise<Buffer> {
    const url: string = `https://www.youtube.com/watch?v=${videoId}`;

    if (!ytdl.validateURL(url)) {
      throw new HttpException('Invalid YouTube URL', HttpStatus.BAD_REQUEST);
    }

    try {
      const videoReadableStream = ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
          }
        }
      });

      const chunks: Buffer[] = [];
      return new Promise<Buffer>((resolve, reject) => {
        videoReadableStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        videoReadableStream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        videoReadableStream.on('error', (err) => {
          this.logger.error('Stream error:', err);
          reject(new HttpException('Failed to stream audio', HttpStatus.INTERNAL_SERVER_ERROR));
        });
      });
    } catch (error) {
      this.logger.error(`Failed to stream audio: ${error.message}`);
      throw new HttpException(`Failed to stream audio: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}