import { Module } from '@nestjs/common';
import { YoutubeBaseController } from './youtube_base.controller';
import { YoutubeBaseService } from './youtube_base.service';
import { YoutubeDataService } from '../../google/youtube-data/youtube-data.service';

@Module({
  controllers: [YoutubeBaseController],
  providers: [YoutubeBaseService, YoutubeDataService]
})
export class YoutubeBaseModule {}
