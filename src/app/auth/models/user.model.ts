export interface UserModel {
  name: string,
  email: string,
  avatar: string,
  bio?: string,
  password: string,
  devicesId?: string[],
  trackFavorites?: string[],
  artistFavorites?: string[],
  playlistFavorites?: string[],
  userLocalToken?: string;
}