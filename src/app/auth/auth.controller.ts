import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { DriveService } from '../google/drive/drive.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private driveService: DriveService) {}

  @Post('reg')
  async register(@Body() body: { name: string, email: string, password: string }) {
    return await this.authService.addUser(body.name, body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string, password: string }) {
    return await this.authService.checkUser(body.email, body.password);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('File not provided');
    }
    return await this.driveService.uploadFile(file, "1gDCpD7ihayvw4v0v-Zb5k0YwC8mLnH5W");
  }

  @Delete('del/:id')
  async deleteFile(@Param('id') id: string) {
    return await this.driveService.deleteFile(id);
  }
}
