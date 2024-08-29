import { Test, TestingModule } from '@nestjs/testing';
import { YoutubeDataService } from './youtube-data.service';

describe('YoutubeDataService', () => {
  let service: YoutubeDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YoutubeDataService],
    }).compile();

    service = module.get<YoutubeDataService>(YoutubeDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
