import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DriveService {
  private driveClient: drive_v3.Drive;
  private logger = new Logger(DriveService.name);

  constructor(private readonly httpService: HttpService) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        "type": "service_account",
        "project_id": "dynamics-9080b",
        "private_key_id": "b47df8355a1188dd875077ea773953d69a1f0737",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCekgRkFdFnuEml\neiS9zvefXCetMLKmaQ7pGTRpVp7Ru4pRdlMrDHkjByaBTAun9TT47DBp/nmiMlnM\nd/NqsQgVA68cocg61DyIizyokN4cmVWE9UuHNEqZoJYs0sQJAexIeoft1PuEoM+8\nm4/28SywEL3rXuXmuuFaNVyp5ahztAygpVyA8SKFEK+QlefEQhtuh7xykWNE9lNI\nMwmzTB2ECKlI9RDKyOPCDwz+JYGYj3Gsj76nYNIA1jTbEhXlaeRO7OHuF1L+Y9jn\ngRSDvlvGpUefmuhLakNI2bLanZZ69ayt0KOAMtNq6xtNyGexSsouJVqfcTgTLbMe\nbGKDcnbNAgMBAAECggEAB5FmJpVd/apvereAz72e1tsR77Oedc/CIkDi3fuAL/gD\nQCO6u21oeKdWNfSNrTHy7xsYAm8JRML3bd6fCPgIWoxm9qGytJAS5YdpA+M0yT5O\nNRQfSzAlNqjR514VyheZPH+l7iVsmFCz1BzD5bVupxEy0ewhDSkyfoODzSivU0+b\nbz/4SVNE5HoiJvhwiPsU4wpE5PibRK4Vg7rL3wsyaA2inAqt7POeCwuaZecZIDYu\n7yoo5dRBIukEQUHmQObAv82Jr3Wj0uSCChmq5Ib9m2xM3jzRpNeb7aU11UHE2KgA\nqe5DZebwGb6qhD4Ml0C2cKsbXAxam4cQxgf12jJIBwKBgQDYetFO9mrf+134WhRV\nvpRjR9i2XNHPrIGnWV2Y70TypBm0DkUK2HE/9IXlrZZZb4JKHXS0dCg1TxIo67Rt\nyMJAqHePSC7YB+XIn3uC8A04fcoQo78ANCzCQIu3ZkKtKn/xEbrPH6cQtWFDykGk\nxnsJsL/uA+UXxn2gh41XjOqBPwKBgQC7hM33Tzj+SR6h5bCFq4QSFvTe8WijAAC1\nHWtjKkZsufsZRJE5f6+/TarBgv17kCpZD5UKHoBvQapcXfREBGaSuxnR+RrjRc0X\nXaOugdF0tu7OgSul0svkwR1eG9EhEjAHUpECBRjA3cVneXC7MvKIwzhvHlVG2FDx\ncpEwkmw48wKBgQCyGalmS3l2OPoAvyuHt7mhTJTQw+Ch+QzaP72vevrAnZ2/8xV+\nbMAPm/8lDQFrJ0CL9Vv0srP518na/MB+qfKW+4MR0JMpjKXRvtQAz7owxdyef/k+\nE67XSf8oreshSJvmG24TxbjPGEqjWR1UkS7ctBvTmES8oMLudVcltnugRQKBgCEZ\nYAG3SigYX//Tu0Tc8YL/6lkv43hiF73gY4QtgiDO8zOSls+/ahYqb2mY5YVZ/R+b\nUINovuLkhF2pd+RJopFj1Trq7YQQXhMxxCKZZ49ieuSYiEvM2ZCXRcfGwTNFMpUY\nTeA9ZhElFCMfnHZul8DsNJnokMTgiekUf+xC7DdhAoGBAIcS5jVgqtPwL70IdQKe\nhHd2trCeFp0aNJ8hxWr8t/iIox+J9m7rKNWsLhImT76pH2pPywDQhTOn+yewJg4A\nz6HPN0ghEcPKostvW1nAolGB2SE5ak9t9sBeX0EjbPh9sEad38CwYIJaxM2Xe4i1\npWE91KYUDcrYhpnl2l/khroE\n-----END PRIVATE KEY-----\n",
        "client_email": "dynamics@dynamics-9080b.iam.gserviceaccount.com",
        "client_id": "112370214838658259860",
        "universe_domain": "googleapis.com"
      },
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

  async getFile(fileId: string, res): Promise<Buffer> {
    try {
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
        { responseType: 'arraybuffer' }
      );

      const buffer = Buffer.from(response.data as ArrayBuffer);

      console.log('API Call Status:', response.status);

      return res.status(HttpStatus.OK).contentType(mimeType).send(buffer);
    } catch (error) {
      this.logger.error(`Failed to get file content: ${error.message}`);
      throw new HttpException(`Failed to get file content: ${error.message}`, HttpStatus.FOUND);
    }
  }

  async uploadFile(file: Express.Multer.File, folderId: string) {
    const stream = this.bufferToStream(file.buffer);
    try {
      const response = await this.driveClient.files.create({
        requestBody: {
          name: file.originalname,
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