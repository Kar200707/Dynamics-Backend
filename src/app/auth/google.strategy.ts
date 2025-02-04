import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.HOST + '/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile;
    console.log(profile);

    let user = await this.userModel.findOne({ email: emails[0].value });

    if (!user) {
      const payload = { email: emails[0].value, name: name.givenName };
      user = await this.userModel.create({
        name: name.givenName,
        email: emails[0].value,
        avatar: photos[0].value,
        password: null,
        bio: '',
        userLocalToken: this.jwtService.sign(payload, { secret: process.env.JWT_SECRET_KEY }),
        artistFavorites: [],
        devicesId: [],
        playlistFavorites: [],
        trackFavorites: [],
      });
    } else {
      if (user.avatar !== photos[0].value) {
        let updatedUser = user;
        updatedUser.avatar = photos[0].value;
        updatedUser.name = name.givenName;
        updatedUser.email = emails[0].value;

        await this.userModel.findOneAndUpdate({ email: emails[0].value }, updatedUser);
      }
    }

    done(null, user);
  }
}