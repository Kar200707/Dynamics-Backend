import { Test, TestingModule } from '@nestjs/testing';
import { YoutubeBaseController } from './youtube_base.controller';

describe('YoutubeBaseController', () => {
  let controller: YoutubeBaseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YoutubeBaseController],
    }).compile();

    controller = module.get<YoutubeBaseController>(YoutubeBaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
