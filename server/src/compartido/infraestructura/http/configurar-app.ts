import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import {
  CONFIGURACION,
  type Configuracion,
} from '../configuracion/configuracion';
import { crearValidationPipe } from './crear-validation-pipe';
import { ErroresHttpFilter } from './errores-http.filter';

/**
 * Aplica la configuración HTTP común al server real y a las pruebas: prefijo
 * `/api`, cabeceras de seguridad, protección CSRF, validación y errores en español.
 * No se habilita CORS: el client llama a la API por el mismo origen.
 */
export function configurarApp(app: NestExpressApplication): void {
  const configuracion = app.get<Configuracion>(CONFIGURACION);
  app.set('trust proxy', configuracion.saltosDeProxy);
  app.setGlobalPrefix('api');
  app.useSecurityHeaders();
  app.enableCsrfProtection();
  app.use(cookieParser());
  app.useGlobalPipes(crearValidationPipe());
  app.useGlobalFilters(new ErroresHttpFilter());
  app.enableShutdownHooks();
}
