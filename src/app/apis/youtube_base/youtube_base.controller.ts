import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { YoutubeDataService } from '../../google/youtube-data/youtube-data.service';

@Controller('youtube-base')
export class YoutubeBaseController {

  constructor(private youtubeBase: YoutubeDataService) { }

  @Post('search')
  async search(@Body() body: { searchText: string }) {
    return await this.youtubeBase.getVideoList(body.searchText);
  }

  @Get('get-stream/:id')
  async getStream(@Param('id') trackId: string, @Res() res: Response, @Req() req: Request) {
    try {
      const audioStream = await this.youtubeBase.streamAudio(trackId);

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="video.mp3"',
      });

      // Handle range requests
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : null;

        const contentLength = end ? (end - start + 1) : null;
        res.setHeader('Content-Range', `bytes ${start}-${end || ''}/${contentLength}`);

        res.status(HttpStatus.PARTIAL_CONTENT);
        audioStream.pipe(res);
      } else {
        audioStream.pipe(res);
      }
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).send({ message: error.message });
    }
  }
}
