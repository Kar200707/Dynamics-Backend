import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {

  constructor(private userService: UserService) {  }

  @Post('account')
  async getAccountByToken(@Body() body: { acsses_token: string }) {
    return await this.userService.getAccount(body.acsses_token);
  }

}
