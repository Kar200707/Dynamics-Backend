import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { YoutubeDataService } from '../../google/youtube-data/youtube-data.service';
import * as buffer from 'node:buffer';

@Controller('youtube-base')
export class YoutubeBaseController {

  constructor(private youtubeBase: YoutubeDataService) { }


  @Post('search')
  async searchTest(@Body() body: { searchText: string }) {
    return await this.youtubeBase.getVideoList(body.searchText);
  }

  @Get('get-stream/:id')
  async getStream(@Param('id') trackId: string, @Res() res, @Req() req) {
    try {
      const videoBuffer = await this.youtubeBase.streamAudio(trackId);
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="video.mp3"',
      });

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1]
          ? parseInt(parts[1], 10)
          : videoBuffer.length - 1;
        const fileChunk = videoBuffer.slice(start, end + 1);

        res.setHeader('Content-Range', `bytes ${start}-${end}/${videoBuffer.length}`);

        res.status(HttpStatus.PARTIAL_CONTENT).send(fileChunk);
      } else {
        res.send(videoBuffer);
      }
    } catch (error) {
      res.status(400).send(error.message);
    }
  }
}
