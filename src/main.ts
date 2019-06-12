import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const port = process.env.SRV_PORT || 3030;

async function bootstrap() {
  const srv = await NestFactory.create(AppModule);
  await srv.listen(port);
  Logger.log(`Server is running on ${port} port.`, 'Bootstrap');
}
bootstrap();
