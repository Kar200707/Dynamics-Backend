import { Body, Controller, Get, HttpStatus, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DropboxStorageService } from './app/dropbox/dropbox-storage/dropbox-storage.service';
import { Response } from 'express';

@Controller()
export class AppController {

  constructor(private dropBoxStorageService: DropboxStorageService) {  }

  @Post('hello')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: { path: string }) {
    return await this.dropBoxStorageService.uploadFile(file.originalname, file.buffer, '/images');
  }

  @Get('hello/get/:id')
  async getFile(@Res() res: Response, @Param('id') id: string) {
    try {
      const fileUrl = await this.dropBoxStorageService.getFile('/' + id);
      res.redirect(fileUrl);
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
    }
  }
}
