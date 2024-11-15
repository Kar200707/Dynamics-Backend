import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { toPipeableStream, YtdlCore } from '@ybd-project/ytdl-core';
import { Request, Response } from 'express';
import ytSearch from 'yt-search';
import { Client } from 'youtubei';
import ytch from 'yt-channel-info';
import ytdl from 'ytdl-core';


@Injectable()
export class YoutubeDataService {
  private logger: Logger = new Logger(YoutubeDataService.name);
  private ytdl: YtdlCore;
  private youtubeInfo: Client = new Client();

  constructor() {
    this.ytdl = new YtdlCore({
      logDisplay: ["success", "info", "error"]
    });
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
      const info = await ytdl.getBasicInfo(url);
      // console.log(info.videoDetails);
      return info.videoDetails;
      // const url: string = `https://www.youtube.com/watch?v=${id}`;
      // const info = await this.ytdl.getBasicInfo(url);
      // return info.videoDetails;
    } catch (e) {
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
      res.setHeader('Content-Type', type === 'audio' ? 'audio/webm' : 'video/mp4');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      const videoInfo:any = await this.ytdl.getBasicInfo(url);
      const totalSize = parseInt(videoInfo.videoDetails.lengthSeconds) * 1024 * 1024;

      const stream = await this.ytdl.download(url, {
        quality: "highestaudio",
        filter: "audioonly",

      });

      const pipeableStream = toPipeableStream(stream);

      const range = req.headers.range;

      if (range) {
        const [start, end] = range.replace(/bytes=/, "").split("-");
        const startByte = parseInt(start, 10) || 0;
        const endByte = end ? parseInt(end, 10) : totalSize - 1;
        const chunkSize = (endByte - startByte) + 1;

        res.setHeader('Content-Range', `bytes ${startByte}-${endByte}/${totalSize}`);
        res.setHeader('Content-Length', chunkSize);
        res.status(HttpStatus.PARTIAL_CONTENT);

        let bytesWritten = 0;
        pipeableStream.on('data', (chunk) => {
          if (bytesWritten + chunk.length > chunkSize) {
            chunk = chunk.slice(0, chunkSize - bytesWritten);
          }
          bytesWritten += chunk.length;
          res.write(chunk);
          if (bytesWritten >= chunkSize) {
            pipeableStream.destroy();
          }
        });

        pipeableStream.on('end', () => {
          res.end();
        });
        pipeableStream.on('error', (err: any) => {
          console.error('Stream error:', err);
          res.status(500).send('Error streaming data');
        });
      } else {
        pipeableStream.pipe(res);
      }
    } catch (error) {
      this.logger.error(`Failed to stream ${type}: ${error.message}`);
      throw new HttpException(`Failed to stream ${type}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}