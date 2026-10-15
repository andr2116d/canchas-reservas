import { Controller, Get, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { Roles } from '../src/common/decorators/roles.decorator';
import { PrismaService } from '../src/prisma/prisma.service';

@Controller('prueba-auth')
class PruebaAuthController {
  @Get('admin')
  @Roles('ADMINISTRADOR')
  soloAdmin() {
    return { ok: true };
  }
}

describe('Auth (e2e)', () => {
  const inicio = new Date();
  const correoInactivo = `inactivo.${Date.now()}@laprevia.test`;
  const JUGADOR = { correo: 'jugador1@laprevia.pe', contrasena: 'Jugador123' };
  const ADMIN = { correo: 'admin@laprevia.pe', contrasena: 'Admin12345' };
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
  const cookiesDe = (res: request.Response) =>
    (res.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
  const cookieSesion = (res: request.Response) =>
    cookiesDe(res).find((c) => c.startsWith('sesion='));
  const iniciarSesion = (credenciales: {
    correo: string;
    contrasena: string;
  }) => request(servidor()).post('/api/auth/login').send(credenciales);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [PruebaAuthController],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);
    jwt = modulo.get(JwtService);

    await prisma.usuario.create({
      data: {
        nombres: 'Inactivo Prueba',
        tipoDocumento: 'CE',
        numeroDocumento: `E2E${Date.now()}`,
        correo: correoInactivo,
        telefono: '900000000',
        passwordHash: await hash('Inactivo123', 4),
        rol: 'JUGADOR',
        estado: 'INACTIVO',
      },
    });
  });

  afterAll(async () => {
    await prisma.registroAcceso.deleteMany({
      where: {
        OR: [
          { correo: correoInactivo },
          {
            correo: { in: [JUGADOR.correo, ADMIN.correo] },
            fecha: { gte: inicio },
          },
        ],
      },
    });
    await prisma.usuario.deleteMany({ where: { correo: correoInactivo } });
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('con credenciales correctas devuelve el rol y una cookie httpOnly', async () => {
      const res = await iniciarSesion(JUGADOR).expect(200);
      expect(res.body).toMatchObject({ rol: 'JUGADOR' });
      expect(res.body).toEqual({
        id: expect.any(Number),
        nombres: expect.any(String),
        rol: 'JUGADOR',
      });
      const cookie = cookieSesion(res);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
    });

    it('acepta el correo con espacios y mayúsculas', async () => {
      await iniciarSesion({
        correo: `  ${JUGADOR.correo.toUpperCase()} `,
        contrasena: JUGADOR.contrasena,
      }).expect(200);
    });

    it('con contraseña incorrecta responde 401 y registra CREDENCIALES', async () => {
      const antes = new Date();
      const res = await iniciarSesion({
        ...JUGADOR,
        contrasena: 'incorrecta',
      }).expect(401);
      expect(res.body).toEqual({
        statusCode: 401,
        message: 'Correo o contraseña incorrectos',
        errores: {},
      });
      expect(cookieSesion(res)).toBeUndefined();
      const registro = await prisma.registroAcceso.findFirst({
        where: { correo: JUGADOR.correo, exito: false, fecha: { gte: antes } },
      });
      expect(registro).toMatchObject({ motivo: 'CREDENCIALES', exito: false });
    });

    it('con usuario inactivo responde 403 y registra INACTIVO', async () => {
      const res = await iniciarSesion({
        correo: correoInactivo,
        contrasena: 'Inactivo123',
      }).expect(403);
      expect(res.body).toEqual({
        statusCode: 403,
        message: 'Tu cuenta está desactivada. Contacta al administrador.',
        errores: {},
      });
      expect(cookieSesion(res)).toBeUndefined();
      const registro = await prisma.registroAcceso.findFirst({
        where: { correo: correoInactivo },
      });
      expect(registro).toMatchObject({ motivo: 'INACTIVO', exito: false });
    });

    it('con datos inválidos responde 400 con errores por campo', async () => {
      const res = await request(servidor())
        .post('/api/auth/login')
        .send({ correo: 'no-es-correo', contrasena: '' })
        .expect(400);
      expect(res.body.errores).toEqual({
        correo: expect.any(String),
        contrasena: expect.any(String),
      });
    });
  });

  describe('sesión', () => {
    it('GET /api/auth/me devuelve el usuario y renueva la cookie', async () => {
      const agente = request.agent(servidor());
      await agente.post('/api/auth/login').send(ADMIN).expect(200);
      const res = await agente.get('/api/auth/me').expect(200);
      expect(res.body).toMatchObject({
        correo: ADMIN.correo,
        rol: 'ADMINISTRADOR',
      });
      expect(cookieSesion(res)).toContain('HttpOnly');
    });

    it('sin cookie un endpoint privado responde 401', async () => {
      const res = await request(servidor()).get('/api/auth/me').expect(401);
      expect(res.body).toMatchObject({ statusCode: 401, errores: {} });
    });

    it('un token vencido responde 401 y borra la cookie', async () => {
      const { id } = await prisma.usuario.findUniqueOrThrow({
        where: { correo: JUGADOR.correo },
      });
      const vencido = await jwt.signAsync(
        { sub: String(id), rol: 'JUGADOR' },
        { expiresIn: -10 },
      );
      const res = await request(servidor())
        .get('/api/auth/me')
        .set('Cookie', `sesion=${vencido}`)
        .expect(401);
      expect(cookieSesion(res)).toMatch(/sesion=;/);
    });

    it('un JUGADOR en un endpoint de ADMINISTRADOR recibe 403', async () => {
      const agente = request.agent(servidor());
      await agente.post('/api/auth/login').send(JUGADOR).expect(200);
      const res = await agente.get('/api/prueba-auth/admin').expect(403);
      expect(res.body).toEqual({
        statusCode: 403,
        message: 'Acceso no autorizado',
        errores: {},
      });
    });

    it('un ADMINISTRADOR entra al endpoint de ADMINISTRADOR', async () => {
      const agente = request.agent(servidor());
      await agente.post('/api/auth/login').send(ADMIN).expect(200);
      await agente.get('/api/prueba-auth/admin').expect(200);
    });

    it('POST /api/auth/logout responde 204 y borra la cookie, con o sin sesión', async () => {
      const agente = request.agent(servidor());
      await agente.post('/api/auth/login').send(JUGADOR).expect(200);
      const res = await agente.post('/api/auth/logout').expect(204);
      expect(cookieSesion(res)).toMatch(/sesion=;/);
      await agente.get('/api/auth/me').expect(401);
      await request(servidor()).post('/api/auth/logout').expect(204);
    });
  });

  it('los endpoints de salud siguen siendo públicos', async () => {
    await request(servidor()).get('/api/salud').expect(200);
    await request(servidor()).get('/api/salud/listo').expect(200);
  });
});
