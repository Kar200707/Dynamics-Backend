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
    try {
      return await this.youtubeBase.streamAudio(trackId, req, res);
      //
      // res.setHeader('Content-Type', 'audio/mpeg');
      // res.setHeader('Accept-Ranges', 'bytes');
      //
      // const range = req.headers.range;
      // if (range) {
      //   const parts = range.replace(/bytes=/, "").split("-");
      //   const start = parseInt(parts[0], 10);
      //   const end = parts[1] ? parseInt(parts[1], 10) : audioStream.length - 1;
      //
      //   // Ensure start and end are within bounds
      //   const adjustedStart = Math.max(start, 0);
      //   const adjustedEnd = Math.min(end, audioStream.length - 1);
      //
      //   // Handle cases where the requested range might exceed the file length
      //   if (adjustedStart > adjustedEnd) {
      //     res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).send();
      //     return;
      //   }
      //
      //   const fileChunk = audioStream.slice(adjustedStart, adjustedEnd + 1);
      //
      //   res.setHeader('Content-Range', `bytes ${adjustedStart}-${adjustedEnd}/${audioStream.length}`);
      //   res.setHeader('Content-Length', audioStream.length);
      //   res.status(HttpStatus.OK).send(fileChunk);
      // } else {
      //   res.status(HttpStatus.OK).send(audioStream);
      // }
    } catch (error) {
      console.log(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: 'Failed to stream audio' });
    }
  }
}