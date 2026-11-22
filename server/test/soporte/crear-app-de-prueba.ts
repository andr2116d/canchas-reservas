import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configurarApp } from '../../src/compartido/infraestructura/http/configurar-app';
import { PrismaService } from '../../src/compartido/infraestructura/prisma/prisma.service';

/**
 * Levanta la app completa, configurada igual que en producción, contra la
 * base de pruebas. `ajustar` permite reemplazar providers para simular fallas.
 */
export async function crearAppDePrueba(
  ajustar: (constructor: TestingModuleBuilder) => TestingModuleBuilder = (c) =>
    c,
) {
  const modulo = await ajustar(
    Test.createTestingModule({ imports: [AppModule] }),
  ).compile();
  const app = modulo.createNestApplication<NestExpressApplication>({
    logger: false,
  });
  configurarApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}
