import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tarifas (e2e)', () => {
  const sufijo = String(Date.now()).slice(-11);
  const ADMIN = {
    correo: `admin.tarifas.${sufijo}@laprevia.test`,
    contrasena: 'Admin12345',
  };
  const RECEPCION = {
    correo: `recepcion.tarifas.${sufijo}@laprevia.test`,
    contrasena: 'Recepcion123',
  };

  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: number;
  let cookieAdmin: string;
  let cookieRecepcion: string;
  const canchasCreadas: number[] = [];

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
  const iniciarSesion = (credenciales: {
    correo: string;
    contrasena: string;
  }) => request(servidor()).post('/api/auth/login').send(credenciales);
  const cookieDe = (res: request.Response) =>
    ((res.headers['set-cookie'] as unknown as string[] | undefined) ?? []).find(
      (c) => c.startsWith('sesion='),
    ) ?? '';
  const crearUsuario = async (
    credenciales: { correo: string; contrasena: string },
    rol: 'ADMINISTRADOR' | 'RECEPCIONISTA',
    documento: string,
  ) => {
    const usuario = await prisma.usuario.create({
      data: {
        nombres: `Prueba ${rol}`,
        tipoDocumento: 'CE',
        numeroDocumento: documento,
        correo: credenciales.correo,
        telefono: '900000031',
        passwordHash: await hash(credenciales.contrasena, 4),
        rol,
      },
    });
    return usuario.id;
  };
  const crearCancha = async (texto: string, activa = true) => {
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `${texto} ${sufijo}`,
        tamano: 'FUTBOL_7',
        iluminacion: true,
        activa,
      },
    });
    canchasCreadas.push(cancha.id);
    return cancha.id;
  };
  const definir = (canchaId: number, cuerpo: object, cookie = cookieAdmin) =>
    request(servidor())
      .put(`/api/canchas/${canchaId}/tarifas`)
      .set('Cookie', cookie)
      .send(cuerpo);
  const tarifasDe = (canchaId: number) =>
    prisma.tarifa.findMany({ where: { canchaId }, orderBy: { id: 'asc' } });
  const auditoriasDe = (ids: number[]) =>
    prisma.auditoria.findMany({
      where: { entidad: 'TARIFA', entidadId: { in: ids } },
      orderBy: { id: 'asc' },
    });

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);

    adminId = await crearUsuario(ADMIN, 'ADMINISTRADOR', `A${sufijo}`);
    await crearUsuario(RECEPCION, 'RECEPCIONISTA', `R${sufijo}`);
    cookieAdmin = cookieDe(await iniciarSesion(ADMIN).expect(200));
    cookieRecepcion = cookieDe(await iniciarSesion(RECEPCION).expect(200));
  });

  afterAll(async () => {
    const canchaId = { in: canchasCreadas };
    await prisma.tarifa.deleteMany({ where: { canchaId } });
    await prisma.cancha.deleteMany({ where: { id: canchaId } });
    await app.close();
  });

  describe('PUT /api/canchas/:id/tarifas', () => {
    it('guarda la primera tarifa de la franja y deja CREAR en auditoría', async () => {
      const canchaId = await crearCancha('Tarifa Nueva');

      const res = await definir(canchaId, {
        franja: 'NOCHE',
        valor: 80,
      }).expect(200);

      expect(res.body).toEqual({
        franja: 'NOCHE',
        valor: 80,
        vigenteDesde: expect.any(String),
      });
      const guardadas = await tarifasDe(canchaId);
      expect(guardadas).toHaveLength(1);
      expect(guardadas[0]).toMatchObject({
        franja: 'NOCHE',
        vigenteHasta: null,
        creadoPorId: adminId,
      });
      expect(guardadas[0].valor.toFixed(2)).toBe('80.00');

      const registros = await auditoriasDe([guardadas[0].id]);
      expect(registros).toHaveLength(1);
      expect(registros[0]).toMatchObject({
        usuarioId: adminId,
        accion: 'CREAR',
        detalle: {
          canchaId,
          franja: 'NOCHE',
          anterior: { valor: null },
          nuevo: { valor: 80 },
        },
      });
      expect(registros[0].fecha).toBeInstanceOf(Date);
    });

    it('un valor nuevo cierra el anterior, deja una sola vigente y audita el cambio', async () => {
      const canchaId = await crearCancha('Tarifa Cambio');
      await definir(canchaId, { franja: 'DIA', valor: 50 }).expect(200);

      const res = await definir(canchaId, {
        franja: 'DIA',
        valor: 55.05,
      }).expect(200);

      const [anterior, nueva] = await tarifasDe(canchaId);
      expect(anterior.vigenteHasta).toEqual(nueva.vigenteDesde);
      expect(nueva.vigenteHasta).toBeNull();
      expect(nueva.valor.toFixed(2)).toBe('55.05');
      expect(res.body).toEqual({
        franja: 'DIA',
        valor: 55.05,
        vigenteDesde: nueva.vigenteDesde.toISOString(),
      });

      const registros = await auditoriasDe([nueva.id]);
      expect(registros).toHaveLength(1);
      expect(registros[0]).toMatchObject({
        usuarioId: adminId,
        accion: 'EDITAR',
        detalle: {
          canchaId,
          franja: 'DIA',
          anterior: { valor: 50 },
          nuevo: { valor: 55.05 },
        },
      });
    });

    it('el mismo valor no crea registro ni auditoría', async () => {
      const canchaId = await crearCancha('Tarifa Igual');
      const primera = await definir(canchaId, {
        franja: 'DIA',
        valor: 60,
      }).expect(200);

      const res = await definir(canchaId, {
        franja: 'DIA',
        valor: 60.0,
      }).expect(200);

      expect(res.body).toEqual(primera.body);
      const guardadas = await tarifasDe(canchaId);
      expect(guardadas).toHaveLength(1);
      await expect(auditoriasDe([guardadas[0].id])).resolves.toHaveLength(1);
    });

    it('cambiar una franja no toca la otra', async () => {
      const canchaId = await crearCancha('Tarifa Franjas');
      await definir(canchaId, { franja: 'DIA', valor: 50 }).expect(200);
      await definir(canchaId, { franja: 'NOCHE', valor: 80 }).expect(200);
      await definir(canchaId, { franja: 'NOCHE', valor: 85 }).expect(200);

      const vigentes = await prisma.tarifa.findMany({
        where: { canchaId, vigenteHasta: null },
        orderBy: { franja: 'asc' },
      });
      expect(vigentes.map((t) => [t.franja, t.valor.toFixed(2)])).toEqual([
        ['DIA', '50.00'],
        ['NOCHE', '85.00'],
      ]);
    });

    it('se puede definir en una cancha inactiva', async () => {
      const canchaId = await crearCancha('Tarifa Inactiva', false);

      await definir(canchaId, { franja: 'DIA', valor: 45 }).expect(200);
    });

    it.each([
      [0, 'El valor debe ser mayor que 0'],
      [-5, 'El valor debe ser mayor que 0'],
      ['80', 'El valor debe ser mayor que 0'],
      [null, 'El valor debe ser mayor que 0'],
      [10000, 'El valor no puede ser mayor que 9999.99'],
      [10.555, 'El valor debe tener hasta 2 decimales'],
    ])('con valor %p responde 400: %s', async (valor, mensaje) => {
      const canchaId = await crearCancha(`Tarifa Invalida ${String(valor)}`);

      const res = await definir(canchaId, { franja: 'DIA', valor }).expect(400);

      expect(res.body).toEqual({
        statusCode: 400,
        message: mensaje,
        errores: { valor: mensaje },
      });
      await expect(tarifasDe(canchaId)).resolves.toHaveLength(0);
    });

    it('acepta el máximo 9999.99', async () => {
      const canchaId = await crearCancha('Tarifa Maxima');

      const res = await definir(canchaId, {
        franja: 'NOCHE',
        valor: 9999.99,
      }).expect(200);

      expect((res.body as { valor: number }).valor).toBe(9999.99);
    });

    it('sin franja válida responde 400', async () => {
      const canchaId = await crearCancha('Tarifa Sin Franja');

      const res = await definir(canchaId, {
        franja: 'TARDE',
        valor: 50,
      }).expect(400);

      expect(res.body).toEqual({
        statusCode: 400,
        message: 'Elige la franja Día o Noche',
        errores: { franja: 'Elige la franja Día o Noche' },
      });
    });

    it.each(['999999', '2147483648', 'abc'])(
      'con la cancha %s responde 404',
      async (id) => {
        const res = await request(servidor())
          .put(`/api/canchas/${id}/tarifas`)
          .set('Cookie', cookieAdmin)
          .send({ franja: 'DIA', valor: 50 })
          .expect(404);

        expect(res.body).toEqual({
          statusCode: 404,
          message: 'No se encontró la cancha',
          errores: {},
        });
      },
    );

    it('sin sesión responde 401 y la recepción 403', async () => {
      const canchaId = await crearCancha('Tarifa Permisos');

      await request(servidor())
        .put(`/api/canchas/${canchaId}/tarifas`)
        .send({ franja: 'DIA', valor: 50 })
        .expect(401);
      await definir(
        canchaId,
        { franja: 'DIA', valor: 50 },
        cookieRecepcion,
      ).expect(403);
      await expect(tarifasDe(canchaId)).resolves.toHaveLength(0);
    });
  });
});
