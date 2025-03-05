import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { Playlist } from 'youtubei';

@Controller('playlist')
export class PlaylistController {

  constructor(private playlistService: PlaylistService) {  }

  @Post('get')
  async getPlaylists(@Body() body) {
    return await this.playlistService.getPlaylists(body.token);
  }

  @Post('get/:id')
  async getPlaylistById(@Body() body, @Param('id') id: string) {
    return await this.playlistService.getPlaylistById(body.token, id);
  }

  @Put('update/:id')
  async updatePlaylist(@Body() body, @Param('id') id: string) {
    return await this.playlistService.updatePlaylist(body.token, body.tracks, id);
  }

  @Post('create')
  async addPlaylist(@Body() body) {
    return await this.playlistService.addPlaylist(body.playlistName, body.token, body.tracks ? body.tracks : []);
  }

  @Post('delete/:id')
  async removePlaylist(@Body() body, @Param('id') id: string) {
    return await this.playlistService.removePlaylist(body.token, id);
  }
}
