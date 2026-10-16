import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('IP del registro de accesos detrás de proxies (e2e)', () => {
  const original = process.env.TRUST_PROXY_HOPS;
  const correo = `proxy.${Date.now()}@laprevia.test`;
  const contrasena = 'Proxy12345';
  const cabecera = '203.0.113.7, 198.51.100.2';
  let base: INestApplication;
  let prisma: PrismaService;

  const crearApp = async (saltos: string | undefined) => {
    if (saltos === undefined) delete process.env.TRUST_PROXY_HOPS;
    else process.env.TRUST_PROXY_HOPS = saltos;
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    return app;
  };

  const ipDelLogin = async (app: INestApplication) => {
    const antes = new Date();
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post('/api/auth/login')
      .set('X-Forwarded-For', cabecera)
      .send({ correo, contrasena })
      .expect(200);
    const registro = await prisma.registroAcceso.findFirstOrThrow({
      where: { correo, exito: true, fecha: { gte: antes } },
      orderBy: { id: 'desc' },
    });
    return registro.ip;
  };

  beforeAll(async () => {
    base = await crearApp(undefined);
    prisma = base.get(PrismaService);
    await prisma.usuario.create({
      data: {
        nombres: 'Proxy Prueba',
        tipoDocumento: 'CE',
        numeroDocumento: `PX${Date.now()}`,
        correo,
        telefono: '900000001',
        passwordHash: await hash(contrasena, 4),
        rol: 'JUGADOR',
      },
    });
  });

  afterAll(async () => {
    await prisma.registroAcceso.deleteMany({ where: { correo } });
    await prisma.usuario.deleteMany({ where: { correo } });
    await base.close();
    if (original === undefined) delete process.env.TRUST_PROXY_HOPS;
    else process.env.TRUST_PROXY_HOPS = original;
  });

  it('con TRUST_PROXY_HOPS=2 guarda la IP del usuario de X-Forwarded-For', async () => {
    const app = await crearApp('2');
    try {
      expect(await ipDelLogin(app)).toBe('203.0.113.7');
    } finally {
      await app.close();
    }
  });

  it('sin TRUST_PROXY_HOPS guarda la IP del socket e ignora la cabecera', async () => {
    const app = await crearApp(undefined);
    try {
      const ip = await ipDelLogin(app);
      expect(ip).not.toBe('203.0.113.7');
      expect(ip).not.toBe('198.51.100.2');
      expect(ip).toMatch(/^(::ffff:127\.0\.0\.1|127\.0\.0\.1|::1)$/);
    } finally {
      await app.close();
    }
  });
});
