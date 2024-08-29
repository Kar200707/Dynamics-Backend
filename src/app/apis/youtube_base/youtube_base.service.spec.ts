import { Test, TestingModule } from '@nestjs/testing';
import { YoutubeBaseService } from './youtube_base.service';

describe('YoutubeBaseService', () => {
  let service: YoutubeBaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YoutubeBaseService],
    }).compile();

    service = module.get<YoutubeBaseService>(YoutubeBaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
