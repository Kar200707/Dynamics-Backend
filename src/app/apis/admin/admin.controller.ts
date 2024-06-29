import { Body, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';

@Controller('admin')
export class AdminController {

  constructor(private adminService: AdminService) {  }

  @Post('track')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'track_file' },
      { name: 'image_file' },
    ])
  )
  async addTrack(
    @Body() body: { access_token: string; trackDetails: any },
    @UploadedFiles()
      files: {
      track_file?: Express.Multer.File;
      image_file?: Express.Multer.File;
    }
  ) {

    const trackFile = files.track_file?.[0];
    const imageFile = files.image_file?.[0];

    return await this.adminService.addTrack(body, body.access_token, trackFile, imageFile);
  }
}
