import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import {
  CONFIGURACION,
  type Configuracion,
} from './compartido/infraestructura/configuracion/configuracion';
import { configurarApp } from './compartido/infraestructura/http/configurar-app';

async function iniciar(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configurarApp(app);
  await app.listen(app.get<Configuracion>(CONFIGURACION).puerto);
}
void iniciar();
