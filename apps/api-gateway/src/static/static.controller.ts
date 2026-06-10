import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller()
export class StaticController {
  @Get('favicon.ico')
  favicon(@Res() res: Response) {
    // 204 No Content – silences favicon logs
    res.status(204).send();
  }
}
