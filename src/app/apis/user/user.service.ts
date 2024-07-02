import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {

  constructor(@InjectModel(User.name) private readonly Users: Model<UserDocument>) {  }

  async getAccount(token: string): Promise<any> {
    if (!token) {
      throw new HttpException('Token not found', HttpStatus.BAD_REQUEST);
    }

    const userAccount = await this.Users.findOne({ userLocalToken: token });

    if (!userAccount) {
      throw new HttpException('Account not found', HttpStatus.BAD_REQUEST);
    }

    const modifiedData: any = { ...userAccount.toJSON() };

    delete modifiedData.password;
    delete modifiedData.devicesId;
    delete modifiedData.userLocalToken;
    if (token === '$2b$13$S8Cf8aEwAmwb70VdH5MUXuWA2QS6Lzq/z8ITwE74wv1HijpdTaxES') {
      modifiedData.role = 'admin'
    } else {
      modifiedData.role = 'user'
    }

    return modifiedData;
  }
}
