import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('admin')
export class AdminController {

  constructor(private adminService: AdminService) {  }

  @Post('track')
  @UseInterceptors(FileInterceptor('track_file'))
  @UseInterceptors(FileInterceptor('image_file'))
  async addTrack(@Body() body: { access_token: string, trackDetails: any },
                 @UploadedFile('image_file') image_file: Express.Multer.File,
                 @UploadedFile('track_file') track_file: Express.Multer.File) {
    return await this.adminService.addTrack(body.trackDetails, body.access_token, track_file, image_file);
  }
}
