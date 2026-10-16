import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { MENSAJE_FILTRO_ACTIVO } from '../src/modules/adicionales/dto/listar-adicionales.dto';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Adicionales (e2e)', () => {
  const sufijo = String(Date.now()).slice(-11);
  const ADMIN = {
    correo: `admin.adicionales.${sufijo}@laprevia.test`,
    contrasena: 'Admin12345',
  };

  let app: INestApplication;
  let prisma: PrismaService;
  let cookieAdmin: string;
  const adicionalesCreados: number[] = [];

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
  const cookieDe = (res: request.Response) =>
    ((res.headers['set-cookie'] as unknown as string[] | undefined) ?? []).find(
      (c) => c.startsWith('sesion='),
    ) ?? '';
  const listar = (consulta: string) =>
    request(servidor())
      .get(`/api/adicionales${consulta}`)
      .set('Cookie', cookieAdmin);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);

    await prisma.usuario.create({
      data: {
        nombres: 'Admin Adicionales',
        tipoDocumento: 'CE',
        numeroDocumento: `D${sufijo}`,
        correo: ADMIN.correo,
        telefono: '900000003',
        passwordHash: await hash(ADMIN.contrasena, 4),
        rol: 'ADMINISTRADOR',
      },
    });
    cookieAdmin = cookieDe(
      await request(servidor()).post('/api/auth/login').send(ADMIN).expect(200),
    );

    const activo = await prisma.adicional.create({
      data: { nombre: `Activo ${sufijo}`, precio: 5 },
    });
    const inactivo = await prisma.adicional.create({
      data: { nombre: `Inactivo ${sufijo}`, precio: 5, activo: false },
    });
    adicionalesCreados.push(activo.id, inactivo.id);
  });

  afterAll(async () => {
    await prisma.adicional.deleteMany({
      where: { id: { in: adicionalesCreados } },
    });
    await app.close();
  });

  it('GET con activo=abc responde 400 con el motivo', async () => {
    const res = await listar('?activo=abc').expect(400);

    expect(res.body).toEqual({
      statusCode: 400,
      message: MENSAJE_FILTRO_ACTIVO,
      errores: { activo: MENSAJE_FILTRO_ACTIVO },
    });
  });

  it('GET con activo=true no incluye los inactivos y con false solo los inactivos', async () => {
    const [activos, inactivos] = await Promise.all([
      listar('?activo=true').expect(200),
      listar('?activo=false').expect(200),
    ]);
    const nombres = (res: request.Response) =>
      (res.body as { nombre: string }[]).map((a) => a.nombre);

    expect(nombres(activos)).toContain(`Activo ${sufijo}`);
    expect(nombres(activos)).not.toContain(`Inactivo ${sufijo}`);
    expect(nombres(inactivos)).toContain(`Inactivo ${sufijo}`);
    expect(nombres(inactivos)).not.toContain(`Activo ${sufijo}`);
  });
});
