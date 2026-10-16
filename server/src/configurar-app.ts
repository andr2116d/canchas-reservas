import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { Express } from 'express';
import { opcionesCors } from './common/cors';
import { ErroresHttpFilter } from './common/filtros/errores-http.filter';
import { saltosProxy } from './common/trust-proxy';
import { crearValidationPipe } from './common/validacion/validation-pipe';
import { AdaptadorSocketIo } from './modules/tiempo-real/adaptador-socket-io';

export function configurarApp(app: INestApplication) {
  const saltos = saltosProxy();
  if (saltos > 0) {
    const express: Express = app.getHttpAdapter().getInstance();
    express.set('trust proxy', saltos);
  }
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(crearValidationPipe());
  app.useGlobalFilters(new ErroresHttpFilter());
  app.enableCors(opcionesCors());
  app.useWebSocketAdapter(new AdaptadorSocketIo(app));
}
