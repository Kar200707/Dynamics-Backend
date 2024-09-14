import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { YoutubeDataService } from '../../google/youtube-data/youtube-data.service';

@Controller('youtube-base')
export class YoutubeBaseController {

  constructor(private youtubeBase: YoutubeDataService) { }

  @Post('search')
  async search(@Body() body: { searchText: string }) {
    return await this.youtubeBase.getVideoSearchList(body.searchText);
  }

  @Post('get-details/:id')
  async getDetails(@Param('id') trackId: string) {
    return this.youtubeBase.getVideoDetailsById(trackId);
  }

  @Get('get-stream/:id')
  async getStream(@Param('id') trackId: string, @Res() res: Response, @Req() req: Request) {
    try {
      return await this.youtubeBase.streamAudio(trackId, req, res);
    } catch (error) {
      console.log(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: 'Failed to stream audio' });
    }
  }
}