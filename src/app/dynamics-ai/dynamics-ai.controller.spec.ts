import { Test, TestingModule } from '@nestjs/testing';
import { DynamicsAiController } from './dynamics-ai.controller';

describe('DynamicsAiController', () => {
  let controller: DynamicsAiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DynamicsAiController],
    }).compile();

    controller = module.get<DynamicsAiController>(DynamicsAiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
