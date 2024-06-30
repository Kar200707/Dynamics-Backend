import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {

  constructor(private mediaService: MediaService) {  }

  @Get('image/:id')
  async getImage(@Param('id') id: string, @Req() req, @Res() res) {
    return await this.mediaService.getImage(id, res, req);
  }

  @Get('track/:id')
  async getTrack(@Param('id') id: string, @Res() res, @Req() req, @Body() body: { access_token: string }) {
    return await this.mediaService.getTrack(id, body.access_token, res, req);
  }

  @Post('track-details/add-favorites')
  async addFavoritesTrack(@Body() body: { access_token: string, trackId: string }) {
    return await this.mediaService.addFavoriteTracks(body.trackId, body.access_token);
  }

  @Post('track-details/get-favorites-list')
  async getFavoritesTrackList(@Body() body: { access_token: string, trackId: string }) {
    return await this.mediaService.getFavoriteTracksList(body.access_token);
  }
}
