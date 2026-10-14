import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { crearValidationPipe } from './common/validacion/validation-pipe';

export function configurarApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(crearValidationPipe());
  app.enableCors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
    credentials: true,
  });
}
