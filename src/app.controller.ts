import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/hello')
  getHello(): string {
    console.log(process.env.PORT);
    console.log('hello');
    return this.appService.getHello();
  }
}
