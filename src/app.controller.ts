import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { YoutubeDataService } from './app/google/youtube-data/youtube-data.service';

@Controller()
export class AppController {

  constructor(private youtube: YoutubeDataService) {  }

  // @Post('hello')
  // @UseInterceptors(FileInterceptor('file'))
  // async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: { path: string }) {
  //   return await this.dropBoxStorageService.uploadFile(file.originalname, file.buffer, '/images');
  // }

  // @Get('hello/get/:id')
  // async getFile(@Res() res: Response, @Param('id') id: string) {
  //   try {
  //     const fileUrl = await this.dropBoxStorageService.getFile('/' + id);
  //     res.redirect(fileUrl);
  //   } catch (error) {
  //     res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
  //   }
  // }

  @Get('hello/search')
  async searchTest(@Query('q') query) {
    return await this.youtube.getVideoList(query);
  }
}
