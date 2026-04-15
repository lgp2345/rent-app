import 'reflect-metadata';
import cors from '@fastify/cors';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await app.register(cors as any, {
    origin: true,
  });
  app.useGlobalPipes(new ZodValidationPipe());
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
