import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AI, allModels } from 'unlimited-ai';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Model, Schema } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';

@Injectable()
export class DynamicsAiService {
  ai: AI = new AI({
    model: "gpt-4o-mini"
  });

  constructor(
    @InjectModel(Chat.name) private readonly Chats: Model<ChatDocument>,
    @InjectModel(User.name) private readonly Users: Model<UserDocument>) {}

  async getModels(token: string) {
    try {
      const user = await this.Users.findOne({ userLocalToken: token });

      if (!user) {
        throw new HttpException('Local token invalid', HttpStatus.BAD_REQUEST);
      }

      const models = await allModels();

      return { models };
    } catch (e) {
      console.log(e);
      throw new HttpException('none models', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addChat(body): Promise<any> {
    const { token } = body;
    if (!token) {
      throw new HttpException('Invalid Data', HttpStatus.BAD_REQUEST);
    }
    try {
      const user = await this.Users.findOne({ userLocalToken: token });

      if (!user) {
        throw new HttpException('Local token invalid', HttpStatus.BAD_REQUEST);
      }

      const data = await this.Chats.create({
        userId: user._id,
        at: Date.now(),
        chat: []
      })

      return { chatId: data._id };
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  async getChatById(token: string, chatId: string) {
    if (!token || !chatId) {
      throw new HttpException('Invalid Data', HttpStatus.BAD_REQUEST);
    }

    const user = await this.Users.findOne({ userLocalToken: token });

    if (!user) {
      throw new HttpException('Local token invalid', HttpStatus.BAD_REQUEST);
    }

    const chatData = await this.Chats.findOne({ _id: chatId, userId: user._id });

    if (!chatData) {
      throw new HttpException('Chat does not belong to the user or does not exist', HttpStatus.FORBIDDEN);
    }

    return { chat: chatData };
  }

  async getAllChats(token: string) {
    if (!token) {
      throw new HttpException('Invalid Data', HttpStatus.BAD_REQUEST);
    }

    const user = await this.Users.findOne({ userLocalToken: token });

    if (!user) {
      throw new HttpException('Local token invalid', HttpStatus.BAD_REQUEST);
    }

    const chatData = await this.Chats.find({ userId: user._id });

    if (!chatData) {
      throw new HttpException('Chat does not belong to the user or does not exist', HttpStatus.FORBIDDEN);
    }

    return { chats: chatData };
  }

  async chatMessage(body, chatId: string): Promise<any> {
    const { token, message, aiModel } = body;

    if (!token || !chatId || !message || !aiModel) {
      throw new HttpException('Invalid Data', HttpStatus.BAD_REQUEST);
    }

    try {
      const user = await this.Users.findOne({ userLocalToken: token });

      if (!user) {
        throw new HttpException('Local token invalid', HttpStatus.BAD_REQUEST);
      }

      const chatData = await this.Chats.findOne({ _id: chatId, userId: user._id });

      if (!chatData) {
        throw new HttpException('Chat does not belong to the user or does not exist', HttpStatus.FORBIDDEN);
      }

      chatData.chat.push({
        role: 'user',
        at: Date.now(),
        content: message,
      });

      this.ai.setModel(aiModel);
      this.ai.setMessages(chatData.chat);

      const generatedText = await this.ai.generate();

      chatData.chat.push({
        role: 'assistant',
        at: Date.now(),
        content: generatedText as any,
      });

      const updatedChat = await this.Chats.findOneAndUpdate(
        { _id: chatId },
        { chat: chatData.chat },
        { new: true }
      );

      return { aiMessage: generatedText };
    } catch (error) {
      console.error('Error:', error.message);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteChat(token: string, chatId: string): Promise<any> {
    if (!token || !chatId) {
      throw new HttpException('Invalid Data', HttpStatus.BAD_REQUEST);
    }

    try {
      const user = await this.Users.findOne({ userLocalToken: token });

      if (!user) {
        throw new HttpException('Local token invalid', HttpStatus.BAD_REQUEST);
      }

      const chatData = await this.Chats.findOne({ _id: chatId, userId: user._id });

      if (!chatData) {
        throw new HttpException('Chat does not belong to the user or does not exist', HttpStatus.FORBIDDEN);
      }

      await this.Chats.deleteOne({ _id: chatId });

      return { message: 'Chat deleted successfully' };
    } catch (error) {
      console.error('Error:', error.message);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
