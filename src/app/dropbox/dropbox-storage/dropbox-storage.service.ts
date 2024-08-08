import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Dropbox } from 'dropbox';
import { v4 as uuidv4 } from 'uuid';
import { query } from 'express';

@Injectable()
export class DropboxStorageService {
  private dbx: Dropbox;

  constructor() {
    this.dbx = new Dropbox({
      accessToken: process.env.DROPBOX_ACCESS_TOKEN,
      fetch
    });
  }

  async uploadFile(fileName: string, contents: Buffer, path?: string) {
    const uniqueFilename = fileName;
    const uploadPath = `${path}/${uniqueFilename}`.replace(/\\/g, '/');
    const encodedPath = encodeURI(uploadPath);

    try {
      console.log(`Uploading file to path: ${uploadPath}`);
      const response = await this.dbx.filesUpload({ path: uploadPath, contents });
      console.log('Upload response:', response);
      return response;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async getFile(id: string) {
    try {
      const response = await this.dbx.sharingCreateSharedLinkWithSettings(
        { path: id }
      );
      console.log('Shared link response:', response);
      return response.result.url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    } catch (error) {
      if (error.error && error.error.error_summary.includes('shared_link_already_exists')) {
        const sharedLinksResponse = await this.dbx.sharingListSharedLinks(
          {
            path: id,
            direct_only: true
          }
        );
        return sharedLinksResponse.result.links[0].url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      } else {
        console.log(error);
        throw new HttpException(`Failed to get file`, HttpStatus.NOT_FOUND);
      }
    }
  }

  async searchFile(query) {
    const response = await this.dbx.filesSearchV2(
      query
    );
  }
}
