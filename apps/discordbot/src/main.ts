/**
 * Entry point for the NestJS application.
 * This file sets up the application, including middleware, CORS, validation, logging, and Swagger documentation.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type LogFormat } from '@workspace/logger';
import { StructuredLogger } from 'utils/logger';
import { AppModule } from './app.module';

declare const module: any;

/**
 * Bootstrap function to initialize the NestJS application.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  /**
   * Use structured logging with specified options.
   */
  app.useLogger(new StructuredLogger({ level: 'info', format: process.env.LOG_FORMAT as LogFormat }));

  const logger = new Logger('EntryPoint');

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  logger.log(`Server running`);
}

bootstrap();
