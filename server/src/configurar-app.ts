import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { opcionesCors } from './common/cors';
import { crearValidationPipe } from './common/validacion/validation-pipe';

export function configurarApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(crearValidationPipe());
  app.enableCors(opcionesCors());
}
