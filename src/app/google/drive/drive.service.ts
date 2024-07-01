import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import * as stream from 'stream';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class DriveService {
  private driveClient: drive_v3.Drive;
  private logger = new Logger(DriveService.name);

  constructor(private httpService: HttpService) {

    const auth = new google.auth.GoogleAuth({
      keyFile: './src/app/google/dynamics-9080b-9e2d8c312990.json',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    this.driveClient = google.drive({ version: 'v3', auth });
  }

  private bufferToStream(buffer: Buffer): Readable {
    const readableInstanceStream = new Readable();
    readableInstanceStream.push(buffer);
    readableInstanceStream.push(null);
    return readableInstanceStream;
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
    });
  }

  async getFile(fileId: string, res, req, called: string): Promise<void> {
    const metadataResponse = await this.driveClient.files.get({
      fileId: fileId,
      fields: 'mimeType',
    });

    const mimeType = metadataResponse.data.mimeType;

    const response = await this.driveClient.files.get(
      {
        fileId: fileId,
        alt: 'media',
      },
      { responseType: 'stream' }
    );

    const buffer = await this.streamToBuffer(response.data);

    res.setHeader('Content-Type', mimeType);

    if (mimeType.startsWith('image')) {
      return res.status(HttpStatus.OK).send(buffer);
    } else {
      if (mimeType.startsWith('audio') && called === 'audio') {
        const range = req.headers.range;
        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1]
            ? parseInt(parts[1], 10)
            : buffer.length - 1;
          const fileChunk = buffer.slice(start, end + 1);

          res.setHeader('Content-Range', `bytes ${start}-${end}/${buffer.length}`);

          res.status(HttpStatus.PARTIAL_CONTENT).send(fileChunk);
        } else {
          res.status(HttpStatus.OK).send(buffer);
        }
      } else {
        throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
      }
    }
  }

  async uploadFile(file: Express.Multer.File, folderId: string) {
    const stream = this.bufferToStream(file.buffer);
    try {
      const response = await this.driveClient.files.create({
        requestBody: {
          name: `${uuidv4()}.${file.originalname.split('.').pop()}`,
          parents: [folderId],
        },
        media: {
          mimeType: file.mimetype,
          body: stream,
        },
      });

      const fileId = response.data.id;
      const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

      return {
        ...response.data,
        fileUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(fileId: string) {
    try {
      const response = await this.driveClient.files.delete({
        fileId: fileId,
        supportsAllDrives: true
      });

      if (response.status === 204) {
        return { message: 'File deleted' };
      } else {
        throw new HttpException('File not deleted', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException(`Failed to get file content: ${error.message}`, HttpStatus.FOUND);
    }
  }
}