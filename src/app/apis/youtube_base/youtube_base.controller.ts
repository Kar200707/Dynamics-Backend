import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
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

    const audioStream:any = await this.youtubeBase.streamAudio(trackId);
    res.setHeader('Content-Type', "audio/mpeg");

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1]
        ? parseInt(parts[1], 10)
        : audioStream.length - 1;
      const fileChunk = audioStream.slice(start, end + 1);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${audioStream.length}`);
      res.status(HttpStatus.PARTIAL_CONTENT).send(fileChunk);
    } else {
      res.status(HttpStatus.OK).send(audioStream);
    }
  }
}
