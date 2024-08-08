import { Test, TestingModule } from '@nestjs/testing';
import { DropboxStorageService } from './dropbox-storage.service';

describe('DropboxStorageService', () => {
  let service: DropboxStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DropboxStorageService],
    }).compile();

    service = module.get<DropboxStorageService>(DropboxStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
