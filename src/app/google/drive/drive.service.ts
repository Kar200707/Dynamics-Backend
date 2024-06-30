import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import * as stream from 'stream';

@Injectable()
export class DriveService {
  private driveClient: drive_v3.Drive;
  private logger = new Logger(DriveService.name);

  constructor() {
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

  async getFile(fileId: string, res, req, called: string): Promise<void> {
    const startTime = Date.now(); // Start timer

    const metadataResponse = await this.driveClient.files.get({
      fileId: fileId,
      fields: 'mimeType, size',
    });

    const mimeType = metadataResponse.data.mimeType;
    const fileSize = parseInt(metadataResponse.data.size);

    const response = await this.driveClient.files.get(
      {
        fileId: fileId,
        alt: 'media',
      },
      { responseType: 'arraybuffer' }
    );

    const endTime = Date.now();
    const buffer = Buffer.from(response.data as ArrayBuffer);

    this.logger.log(`API Call Status: ${response.status}, Time Taken: ${endTime - startTime}ms`);

    if (mimeType.startsWith('image')) {
      res.setHeader('Content-Type', mimeType);
      return res.status(HttpStatus.OK).contentType(mimeType).send(buffer);
    } else {
      if (mimeType.startsWith('audio')) {
        res.setHeader('Content-Type', mimeType);

        const range = req.headers.range;
        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1]
            ? parseInt(parts[1], 10)
            : buffer.length - 1;
          const chunksize = (end - start) + 1;
          const fileChunk = buffer.slice(start, end + 1);

          res.setHeader('Content-Range', `bytes ${start}-${end}/${buffer.length}`);
          res.status(HttpStatus.PARTIAL_CONTENT).send(fileChunk);
        } else {
          res.status(HttpStatus.OK)
            .send(buffer);
        }
        return res.status(HttpStatus.OK).contentType(mimeType).send(buffer);
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