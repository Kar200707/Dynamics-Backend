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

  async getVideoDetailsById(id: string) {
    const url: string = `https://www.youtube.com/watch?v=${id}`;
    const details = await this.ytdl.getBasicInfo(url);
    return details;
  }

  async getVideoSearchList(query: string): Promise<any> {
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
      // Set initial response headers
      res.setHeader('Content-Type', 'audio/webm');

      // Create a video stream
      const videoStream = this.ytdl.download(url, {
        filter: 'audioonly',
        quality: 'highestaudio'
      });

      // Handle range requests
      const range = req.headers.range;
      if (range) {
        const [start, end] = range.replace(/bytes=/, "").split("-");
        const startByte = parseInt(start, 10);
        const endByte = end ? parseInt(end, 10) : undefined;

        // Send the appropriate range of bytes
        videoStream.on('response', (response) => {
          const totalBytes = parseInt(response.headers['content-length'], 10);
          const chunkSize = (endByte !== undefined ? endByte - startByte + 1 : totalBytes - startByte);

          res.setHeader('Content-Range', `bytes ${startByte}-${endByte || (totalBytes - 1)}/${totalBytes}`);
          res.setHeader('Content-Length', chunkSize);
          res.status(HttpStatus.PARTIAL_CONTENT);

          // Adjust the stream to start at the requested byte range
          videoStream.pipe(res, { end: false });
          videoStream.on('end', () => {
            res.end();
          });
        });

        videoStream.on('error', (error) => {
          this.logger.error('Error streaming audio:', error.message);
          res.status(500).send('Error streaming YouTube audio');
        });
      } else {
        // Handle full stream if no range is requested
        videoStream.pipe(res);

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