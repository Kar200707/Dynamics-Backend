import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {

  constructor(private mediaService: MediaService) {  }

  @Get('image/:id')
  async getImage(@Param('id') id: string, @Res() res) {
    const url:string = await this.mediaService.getFile(id);
    res.redirect(url);
  }

  @Get('track/:id')
  async getTrack(@Param('id') id: string, @Res() res) {
    const url:string = await this.mediaService.getFile(id);
    res.redirect(url);
  }

  @Post('track-details/add-favorites')
  async addFavoritesTrack(@Body() body: { access_token: string, trackId: string }) {
    return await this.mediaService.addFavoriteTracks(body.trackId, body.access_token);
  }

  @Post('track-details/get-favorites-list')
  async getFavoritesTrackList(@Body() body: { access_token: string, trackId: string }) {
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
