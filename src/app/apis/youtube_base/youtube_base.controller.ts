import { Body, Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { YoutubeDataService } from '../../google/youtube-data/youtube-data.service';

@Controller('youtube-base')
export class YoutubeBaseController {

  constructor(private youtubeBase: YoutubeDataService) { }

  @Post('search')
  async search(@Body() body: { searchText: string }) {
    return await this.youtubeBase.getVideoSearchList(body.searchText);
  }

  @Post('get-channel-info/:channelId')
  async getChannelInfo(@Param('channelId') query: string) {
    return await this.youtubeBase.getChannelInfo(query);
  }

  @Post('get-details/:id')
  async getDetails(@Param('id') trackId: string) {
    return this.youtubeBase.getVideoDetailsById(trackId);
  }

  @Post('get-author-id-by-video-id/:id')
  async getAuthorIdByVideoId(@Param('id') trackId: string) {
    return this.youtubeBase.getAuthorIdByVideoId(trackId);
  }

  @Get('get-stream/:id')
  async getStream(
    @Param('id') trackId: string,
    @Res() res: Response,
    @Req() req: Request,
    @Query('type') type: string,
    @Query('quality') quality: string
  ) {;
    return await this.youtubeBase.streamAudio(trackId, req, res, type, quality);
  }
}