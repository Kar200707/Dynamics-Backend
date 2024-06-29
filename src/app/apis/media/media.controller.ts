import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {

  constructor(private mediaService: MediaService) {  }

  @Get('image/:id')
  async getImage(@Param('id') id: string, @Res() res) {
    return await this.mediaService.getImage(id, res);
  }

  @Post('track/:id')
  async getTrack(@Param('id') id: string, @Res() res, @Body() body: { access_token: string }) {
    return await this.mediaService.getTrack(id, body.access_token, res);
  }

  @Post('track/details/:id')
  async getTrackDetails() {

  }
}
