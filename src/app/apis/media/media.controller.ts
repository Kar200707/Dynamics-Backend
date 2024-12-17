import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { MediaService } from './media.service';
import * as url from 'node:url';
import { YoutubeDataService } from '../../google/youtube-data/youtube-data.service';
import { Response } from 'express';

@Controller('media')
export class MediaController {

  constructor(
    private ytDataService: YoutubeDataService,
    private mediaService: MediaService) {  }

  @Get('cropImage')
  async cropImage(@Query('url') url: string, @Res() res: Response) {
    try {
      if (!url) {
        return res.status(400).send('URL parameter is required');
      }

      const imageBuffer = await this.mediaService.cropYtImage(url);

      res.set('Content-Type', 'image/jpeg');
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).send('Failed to process image');
    }
  }

  @Post('getPlayerInfoByVideoId')
  async getPlayerInfoByVideoId(@Body() body: { access_token: string, trackId: string }) {
    return await this.mediaService.getPlayerInfoByVideoId(body.trackId, body.access_token);
  }

  @Post('track-details/add-favorites')
  async addFavoritesTrack(@Body() body: { access_token: string, trackId: string }) {
    return await this.mediaService.addFavoriteTracks(body.trackId, body.access_token);
  }

  @Post('set-play-history')
  async setPlayHistory(@Body() body: { access_token: string, trackId: string }) {
    return await this.mediaService.setPlayHistory(body.trackId, body.access_token);
  }

  @Post('set-search-history')
  async setSearchHistory(@Body() body: { access_token: string, text: string }) {
    return await this.mediaService.setSearchHistory(body.text, body.access_token);
  }

  @Post('get-search-history')
  async getSearchHistory(@Body() body: { access_token: string }) {
    return await this.mediaService.getSearchHistory(body.access_token);
  }

  @Post('get-play-history')
  async getPlayHistory(@Body() body: { access_token: string }) {
    return await this.mediaService.getHistoryTracks(body.access_token);
  }

  @Post('track-details/rem-favorites')
  async remFavoritesTrack(@Body() body: { access_token: string, trackId: string }) {
    return await this.mediaService.remFavoriteTracks(body.trackId, body.access_token);
  }

  @Post('track-details/get-favorites-list')
  async getFavoritesTrackList(@Body() body: { access_token: string }) {
    return await this.mediaService.getFavoriteTracksList(body.access_token);
  }

  @Post('track-details/is-favorite')
  async isFavoriteTrack (@Body() body: { trackId: string, access_token: string }) {
    return await this.mediaService.isFavoriteTrack(body.trackId, body.access_token);
  }

  @Post('track-details/get-tracks-list-by-category/:category')
  async getTracksListByCategory(@Param('category') param, @Body() body: { access_token: string }) {
    return await this.mediaService.getTrackByCategory(param, body.access_token);
  }
}
