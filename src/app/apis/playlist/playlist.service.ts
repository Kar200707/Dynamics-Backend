import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Playlist, PlaylistDocument } from './schemas/playlist.schema';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../auth/schemas/user.schema';

@Injectable()
export class PlaylistService {

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Playlist.name) private readonly playlists: Model<PlaylistDocument>) {  }

  async getPlaylists(token: string) {
    if (!token) {
      throw new HttpException('Token undefined', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findOne({ userLocalToken: token });

    if (!user) {
      throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
    }

    const playlists = await this.playlists.find({ userId: user._id });

    return { playlists };
  }

  async getPlaylistById(token: string, id: string) {
    if (!token) {
      throw new HttpException('Token undefined', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findOne({ userLocalToken: token });

    if (!user) {
      throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
    }

    const playlist = await this.playlists.findOne({ _id: id });

    if (playlist.userId != user._id) {
      throw new HttpException('Do you have not access to this playlist', HttpStatus.BAD_REQUEST);
    }

    return { playlist };
  }

  async updatePlaylist(token: string, tracks: any, playlistId: string) {
    if (!token) {
      throw new HttpException('Tracks or Token undefined', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findOne({ userLocalToken: token });

    if (!user) {
      throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
    }

    const userPlaylist = await this.playlists.findOne({ _id: playlistId });

    if (userPlaylist.userId != user._id) {
      throw new HttpException('Do you have not access to this playlist', HttpStatus.BAD_REQUEST);
    }

    const newPlaylist = userPlaylist;
    newPlaylist.tracks = tracks;

    const updatedUserPlaylist = await this.playlists.findOneAndUpdate({ _id: playlistId }, newPlaylist, { new: true });

    return { playlist: updatedUserPlaylist };
  }

  async addPlaylist(playlistName: string, token: string, tracks: any[]) {
    if (!playlistName || !token) {
      throw new HttpException('Playlist Name or Token undefined', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findOne({ userLocalToken: token });

    if (!user) {
      throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
    }

    await this.playlists.create({
      userId: user._id,
      playlistName: playlistName,
      addedAt: Date.now(),
      tracks: tracks,
    });

    return { message: `Playlist ${ playlistName } successfully created` };
  }

  async removePlaylist(token: string, playlistId: string) {
    if (!token || !playlistId) {
      throw new HttpException('PlaylistId or Token undefined', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findOne({ userLocalToken: token });

    if (!user) {
      throw new HttpException('Token Invalid', HttpStatus.BAD_REQUEST);
    }

    const userPlaylist = await this.playlists.findOne({ _id: playlistId });

    if (userPlaylist.userId != user._id) {
      throw new HttpException('Do you have not access to this playlist', HttpStatus.BAD_REQUEST);
    }

    await this.playlists.findByIdAndDelete({ _id: playlistId });

    return { message: `Playlist ${ userPlaylist.playlistName } successfully deleted` };
  }
}
