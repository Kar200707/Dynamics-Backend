import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { MediaService } from './media.service';
import * as ytstream from 'yt-stream';

@Controller('media')
export class MediaController {

  constructor(private mediaService: MediaService) {  }

  @Get('ytstream/:id')
  async getTest(@Res() res, @Param('id') id: string) {
    try {
      const url = `https://www.youtube.com/watch?v=${id}`;
      res.setHeader('Content-Type', 'audio/webm');
      res.setHeader('Connection', 'keep-alive');

      const stream = await ytstream.stream(url, {
        quality: 'high',
        type: 'audio',
        highWaterMark: 1024 * 1024 * 32,
        download: true,
      });

      stream.stream.pipe(res);

      console.log(`Downloaded from URL: ${stream.video_url}`);
    } catch (error) {
      console.error('Error downloading video:', error);
    }
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
