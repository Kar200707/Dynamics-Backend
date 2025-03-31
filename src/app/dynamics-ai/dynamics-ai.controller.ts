import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { DynamicsAiService } from './dynamics-ai.service';
import { Response } from 'express';

@Controller('dynamics-ai')
export class DynamicsAiController {

  constructor(private dyAiService: DynamicsAiService) {}

  @Post('getModels')
  async getModels(@Body() body: { token: string }) {
    return await this.dyAiService.getModels(body.token);
  }

  // @Get('test')
  // async test(@Body() body: { text: string }, @Res() res: Response) {
  //   return this.dyAiService.streamResponse(body.text, res);
  // }

  @Post('get-chat/:id')
  async getChat(@Body() body, @Param('id') id: string) {
    return await this.dyAiService.getChatById(body.token, id);
  }

  @Post('get-chat')
  async getAllChat(@Body() body) {
    return await this.dyAiService.getAllChats(body.token);
  }

  @Post('chat/:id')
  async chatMessage(@Body() body, @Param('id') id: string) {
    return await this.dyAiService.chatMessage(body, id);
  }

  @Post('create-chat')
  async createChat(@Body() body) {
    return await this.dyAiService.addChat(body);
  }

  @Post('chat/delete/:id')
  async removeChat(@Body() body, @Param('id') id: string) {
    return await this.dyAiService.deleteChat(body.token, id);
  }
}
