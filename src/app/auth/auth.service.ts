import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserModel } from './models/user.model';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import validator from 'validator';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private readonly Users: Model<UserDocument>) {}

  async addUser(name: string, email: string, password: string) {
    const findUser = await this.Users.find({email: email});

    if (findUser.length != 0) {
      throw new HttpException({ message: 'this email already registered' }, HttpStatus.BAD_REQUEST);
    }
    if (name && email && password) {
      if (validator.isEmail(email) && password.length > 8) {
        const hashPass:string = await bcrypt.hash(password, 10);
        const hashLocalToken:string = await bcrypt.hash(password, 13);

        let user: UserModel = {
          name: name,
          email: email,
          avatar: '',
          bio: '',
          password: hashPass,
          artistFavorites: [],
          devicesId: [],
          playlistFavorites: [],
          trackFavorites: [],
          userLocalToken: hashLocalToken,
        }

        await this.Users.create(user);

        return { accses_token: hashLocalToken, message: 'register successfully' };
      } else {
        throw new HttpException({ message: 'not valid email or password' }, HttpStatus.BAD_REQUEST);
      }
    } else {
      throw new HttpException({ message: 'the request was completed incorrectly' }, HttpStatus.BAD_REQUEST);
    }
  }

  async checkUser(email: string, password: string) {
    const findUser = await this.Users.find({email: email});

    if (findUser.length == 0) {
      throw new HttpException({ message: 'login not successfully' }, HttpStatus.BAD_REQUEST);
    }
    if (email && password) {
      if (validator.isEmail(email) && password.length > 8) {
        if (await bcrypt.compare(password, findUser[0].password)) {
          return { accses_token: findUser[0].userLocalToken, message: 'login successfully' };
        } else {
          throw new HttpException({ message: 'login not successfully' }, HttpStatus.BAD_REQUEST);
        }
      } else {
        throw new HttpException({ message: 'not valid email or password' }, HttpStatus.BAD_REQUEST);
      }
    } else {
      throw new HttpException({ message: 'the request was completed incorrectly' }, HttpStatus.BAD_REQUEST);
    }
  }
}
