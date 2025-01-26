import { Test, TestingModule } from '@nestjs/testing';
import { DynamicsAiService } from './dynamics-ai.service';

describe('DynamicsAiService', () => {
  let service: DynamicsAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DynamicsAiService],
    }).compile();

    service = module.get<DynamicsAiService>(DynamicsAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
