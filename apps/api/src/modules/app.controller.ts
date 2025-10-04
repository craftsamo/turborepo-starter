import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  async getHello(): Promise<{ message: string }> {
    return { message: 'OK' };
  }
}
