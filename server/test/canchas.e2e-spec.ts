import { ConflictException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import {
  CanchasService,
  MENSAJE_NO_ENCONTRADA,
} from '../src/modules/canchas/canchas.service';
import { PrismaService } from '../src/prisma/prisma.service';

function fechaEnLima(diasDesdeHoy: number) {
  const hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
  }).format(new Date());
  const fecha = new Date(`${hoy}T00:00:00.000Z`);
  fecha.setUTCDate(fecha.getUTCDate() + diasDesdeHoy);
  return fecha;
}

describe('Canchas (e2e)', () => {
  const sufijo = String(Date.now()).slice(-11);
  const ADMIN = {
    correo: `admin.canchas.${sufijo}@laprevia.test`,
    contrasena: 'Admin12345',
  };
  const JUGADOR = {
    correo: `jugador.canchas.${sufijo}@laprevia.test`,
    contrasena: 'Jugador123',
  };
  const nombre = (texto: string) => `${texto} ${sufijo}`;

  let app: INestApplication;
  let prisma: PrismaService;
  let canchas: CanchasService;
  let adminId: number;
  let jugadorId: number;
  let cookieAdmin: string;
  let cookieJugador: string;
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
  const auditoriasDe = (where: Record<string, unknown>) =>
    prisma.auditoria.findMany({
      where: { entidad: 'CANCHA', ...where },
      orderBy: { id: 'asc' },
    });
  const crearCancha = async (texto: string) => {
    const res = await request(servidor())
      .post('/api/canchas')
      .set('Cookie', cookieAdmin)
      .send({ nombre: nombre(texto), tamano: 'FUTBOL_7', iluminacion: false })
      .expect(201);
    const id = (res.body as { id: number }).id;
    canchasCreadas.push(id);
    return id;
  };
  const crearReserva = (
    canchaId: number,
    dias: number,
    estado: 'CONFIRMADA' | 'FINALIZADA',
  ) => {
    const fecha = fechaEnLima(dias);
    const dia = fecha.toISOString().slice(0, 10);
    return prisma.reserva.create({
      data: {
        codigo: `E2E-${sufijo}-${canchaId}-${dias}`,
        jugadorId,
        creadoPorId: jugadorId,
        canchaId,
        fecha,
        horaInicio: '20:00',
        horaFin: '21:00',
        inicioEn: new Date(`${dia}T20:00:00-05:00`),
        finEn: new Date(`${dia}T21:00:00-05:00`),
        franja: 'NOCHE',
        valorTurno: 80,
        adelantoMinimo: 40,
        estado,
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'CREDITO',
      },
    });
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);
    canchas = modulo.get(CanchasService);

    const admin = await prisma.usuario.create({
      data: {
        nombres: 'Admin Canchas',
        tipoDocumento: 'CE',
        numeroDocumento: `C${sufijo}`,
        correo: ADMIN.correo,
        telefono: '900000011',
        passwordHash: await hash(ADMIN.contrasena, 4),
        rol: 'ADMINISTRADOR',
      },
    });
    adminId = admin.id;
    const jugador = await prisma.usuario.create({
      data: {
        nombres: 'Diego',
        apellidos: 'Soto Prueba',
        tipoDocumento: 'CE',
        numeroDocumento: `J${sufijo}`,
        correo: JUGADOR.correo,
        telefono: '900000012',
        passwordHash: await hash(JUGADOR.contrasena, 4),
        rol: 'JUGADOR',
      },
    });
    jugadorId = jugador.id;

    cookieAdmin = cookieDe(await iniciarSesion(ADMIN).expect(200));
    cookieJugador = cookieDe(await iniciarSesion(JUGADOR).expect(200));
  });

  afterAll(async () => {
    const id = { in: canchasCreadas };
    await prisma.reserva.deleteMany({ where: { canchaId: id } });
    await prisma.tarifa.deleteMany({ where: { canchaId: id } });
    await prisma.bloqueo.deleteMany({ where: { canchaId: id } });
    await prisma.cancha.deleteMany({ where: { id } });
    await app.close();
  });

  describe('tabla cancha', () => {
    const unica = nombre('Prueba Unica');

    it('la base rechaza el mismo nombre con otras mayúsculas', async () => {
      const cancha = await canchas.crear(
        { nombre: unica, tamano: 'FUTBOL_5', iluminacion: true },
        adminId,
      );
      canchasCreadas.push(cancha.id);

      await expect(
        prisma.cancha.create({
          data: {
            nombre: unica.toUpperCase(),
            tamano: 'FUTBOL_7',
            iluminacion: false,
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    });

    it('el service lo devuelve como 409', async () => {
      await expect(
        canchas.crear(
          {
            nombre: unica.toLowerCase(),
            tamano: 'FUTBOL_5',
            iluminacion: true,
          },
          adminId,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('POST /api/canchas', () => {
    it('una cancha nueva queda OPERATIVA y activa y deja CREAR en auditoría', async () => {
      const res = await request(servidor())
        .post('/api/canchas')
        .set('Cookie', cookieAdmin)
        .send({
          nombre: nombre('Cancha'),
          tamano: 'FUTBOL_5',
          iluminacion: true,
        })
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(Number),
        nombre: nombre('Cancha'),
        tamano: 'FUTBOL_5',
        iluminacion: true,
        estado: 'OPERATIVA',
        activa: true,
        tieneTarifas: false,
      });
      const id = (res.body as { id: number }).id;
      canchasCreadas.push(id);

      const registros = await auditoriasDe({ entidadId: id });
      expect(registros).toHaveLength(1);
      expect(registros[0]).toMatchObject({
        accion: 'CREAR',
        usuarioId: adminId,
      });
    });

    it('registrar "Cancha" cuando existe "cancha" responde 409 en nombre', async () => {
      const res = await request(servidor())
        .post('/api/canchas')
        .set('Cookie', cookieAdmin)
        .send({
          nombre: nombre('CANCHA'),
          tamano: 'FUTBOL_7',
          iluminacion: false,
        })
        .expect(409);

      expect(res.body).toEqual({
        statusCode: 409,
        message: 'Ya existe una cancha con ese nombre',
        errores: { nombre: 'Ya existe una cancha con ese nombre' },
      });
    });

    it('sin tamaño o sin iluminación responde 400', async () => {
      const sinTamano = await request(servidor())
        .post('/api/canchas')
        .set('Cookie', cookieAdmin)
        .send({ nombre: nombre('Sin tamano'), iluminacion: true })
        .expect(400);
      expect(sinTamano.body).toMatchObject({
        statusCode: 400,
        errores: { tamano: 'Elige Fútbol 5 o Fútbol 7' },
      });

      const sinIluminacion = await request(servidor())
        .post('/api/canchas')
        .set('Cookie', cookieAdmin)
        .send({ nombre: nombre('Sin luz'), tamano: 'FUTBOL_5' })
        .expect(400);
      expect(sinIluminacion.body).toMatchObject({
        statusCode: 400,
        errores: { iluminacion: 'Indica si la cancha tiene iluminación' },
      });
    });
  });

  describe('PATCH /api/canchas/:id', () => {
    let id: number;

    beforeAll(async () => {
      id = await crearCancha('Editable');
    });

    it('edita y guarda en la auditoría solo lo que cambió', async () => {
      const res = await request(servidor())
        .patch(`/api/canchas/${id}`)
        .set('Cookie', cookieAdmin)
        .send({ iluminacion: true, estado: 'EN_MANTENIMIENTO' })
        .expect(200);

      expect(res.body).toMatchObject({
        iluminacion: true,
        estado: 'EN_MANTENIMIENTO',
      });
      const registros = await auditoriasDe({ entidadId: id, accion: 'EDITAR' });
      expect(registros).toHaveLength(1);
      expect(registros[0].detalle).toEqual({
        anterior: { iluminacion: false, estado: 'OPERATIVA' },
        nuevo: { iluminacion: true, estado: 'EN_MANTENIMIENTO' },
      });
    });

    it('con el nombre de otra cancha responde 409 en nombre', async () => {
      const res = await request(servidor())
        .patch(`/api/canchas/${id}`)
        .set('Cookie', cookieAdmin)
        .send({ nombre: nombre('cancha') })
        .expect(409);
      expect(res.body).toMatchObject({
        errores: { nombre: 'Ya existe una cancha con ese nombre' },
      });
    });

    it('con datos inválidos responde 400 y con id inexistente 404', async () => {
      await request(servidor())
        .patch(`/api/canchas/${id}`)
        .set('Cookie', cookieAdmin)
        .send({ estado: 'ROTA' })
        .expect(400);
      const inexistente = await request(servidor())
        .patch('/api/canchas/2147483000')
        .set('Cookie', cookieAdmin)
        .send({ nombre: nombre('Nada') })
        .expect(404);
      expect(inexistente.body).toEqual({
        statusCode: 404,
        message: MENSAJE_NO_ENCONTRADA,
        errores: {},
      });
      await request(servidor())
        .patch('/api/canchas/abc')
        .set('Cookie', cookieAdmin)
        .send({ nombre: nombre('Nada') })
        .expect(404);
    });
  });

  describe('PATCH /api/canchas/:id/activa y GET /api/canchas', () => {
    let id: number;
    let reservaId: number;

    beforeAll(async () => {
      id = await crearCancha('Con reserva');
      reservaId = (await crearReserva(id, 3, 'CONFIRMADA')).id;
    });

    it('desactivar con reservas futuras sin confirmar responde 409 con la lista', async () => {
      const res = await request(servidor())
        .patch(`/api/canchas/${id}/activa`)
        .set('Cookie', cookieAdmin)
        .send({ activa: false })
        .expect(409);

      expect(res.body).toEqual({
        statusCode: 409,
        message:
          'La cancha tiene reservas futuras. Confirma para desactivarla igual',
        errores: {},
        reservasFuturas: [
          {
            id: reservaId,
            codigo: `E2E-${sufijo}-${id}-3`,
            fecha: fechaEnLima(3).toISOString().slice(0, 10),
            horaInicio: '20:00',
            cliente: 'Diego Soto Prueba',
          },
        ],
      });
      const cancha = await prisma.cancha.findUniqueOrThrow({ where: { id } });
      expect(cancha.activa).toBe(true);
    });

    it('con confirmar desactiva, no toca las reservas y audita DESACTIVAR', async () => {
      const res = await request(servidor())
        .patch(`/api/canchas/${id}/activa`)
        .set('Cookie', cookieAdmin)
        .send({ activa: false, confirmar: true })
        .expect(200);

      expect(res.body).toMatchObject({ id, activa: false });
      const reserva = await prisma.reserva.findUniqueOrThrow({
        where: { id: reservaId },
      });
      expect(reserva.estado).toBe('CONFIRMADA');
      const registros = await auditoriasDe({
        entidadId: id,
        accion: 'DESACTIVAR',
      });
      expect(registros).toHaveLength(1);
      expect(registros[0]).toMatchObject({
        usuarioId: adminId,
        detalle: { anterior: { activa: true }, nuevo: { activa: false } },
      });
    });

    it('JUGADOR no ve las canchas desactivadas; el administrador sí', async () => {
      const jugador = await request(servidor())
        .get('/api/canchas')
        .set('Cookie', cookieJugador)
        .expect(200);
      const listaJugador = jugador.body as { id: number; activa: boolean }[];
      expect(listaJugador.some((c) => c.id === id)).toBe(false);
      expect(listaJugador.every((c) => c.activa)).toBe(true);

      const admin = await request(servidor())
        .get('/api/canchas')
        .set('Cookie', cookieAdmin)
        .expect(200);
      expect(admin.body).toContainEqual({
        id,
        nombre: nombre('Con reserva'),
        tamano: 'FUTBOL_7',
        iluminacion: false,
        estado: 'OPERATIVA',
        activa: false,
        tieneTarifas: false,
      });
    });

    it('activar la vuelve a mostrar y audita ACTIVAR', async () => {
      await request(servidor())
        .patch(`/api/canchas/${id}/activa`)
        .set('Cookie', cookieAdmin)
        .send({ activa: true })
        .expect(200);

      expect(
        await auditoriasDe({ entidadId: id, accion: 'ACTIVAR' }),
      ).toHaveLength(1);
      const res = await request(servidor())
        .get('/api/canchas')
        .set('Cookie', cookieJugador)
        .expect(200);
      expect((res.body as { id: number }[]).some((c) => c.id === id)).toBe(
        true,
      );
    });

    it('tieneTarifas solo cuenta tarifas vigentes', async () => {
      await prisma.tarifa.create({
        data: {
          canchaId: id,
          franja: 'DIA',
          valor: 60,
          vigenteHasta: new Date(),
          creadoPorId: adminId,
        },
      });
      const sinVigente = await request(servidor())
        .get('/api/canchas')
        .set('Cookie', cookieAdmin)
        .expect(200);
      expect(sinVigente.body).toContainEqual(
        expect.objectContaining({ id, tieneTarifas: false }),
      );

      await prisma.tarifa.create({
        data: { canchaId: id, franja: 'DIA', valor: 70, creadoPorId: adminId },
      });
      const conVigente = await request(servidor())
        .get('/api/canchas')
        .set('Cookie', cookieAdmin)
        .expect(200);
      expect(conVigente.body).toContainEqual(
        expect.objectContaining({ id, tieneTarifas: true }),
      );
    });
  });

  describe('DELETE /api/canchas/:id', () => {
    it('con reservas futuras responde 409 con la lista', async () => {
      const id = await crearCancha('Borrar futura');
      await crearReserva(id, 1, 'CONFIRMADA');

      const res = await request(servidor())
        .delete(`/api/canchas/${id}`)
        .set('Cookie', cookieAdmin)
        .expect(409);

      expect(res.body).toMatchObject({
        statusCode: 409,
        message: 'La cancha tiene reservas futuras, solo se puede desactivar',
        reservasFuturas: [
          expect.objectContaining({ cliente: 'Diego Soto Prueba' }),
        ],
      });
      expect(await prisma.cancha.findUnique({ where: { id } })).not.toBeNull();
    });

    it('con solo reservas pasadas responde 409 con historial', async () => {
      const id = await crearCancha('Borrar pasada');
      await crearReserva(id, -2, 'FINALIZADA');

      const res = await request(servidor())
        .delete(`/api/canchas/${id}`)
        .set('Cookie', cookieAdmin)
        .expect(409);

      expect(res.body).toEqual({
        statusCode: 409,
        message: 'Tiene historial, solo se puede desactivar',
        errores: {},
      });
    });

    it('sin reservas responde 204, borra tarifas y bloqueos y audita ELIMINAR', async () => {
      const id = await crearCancha('Borrar libre');
      await prisma.tarifa.create({
        data: {
          canchaId: id,
          franja: 'NOCHE',
          valor: 90,
          creadoPorId: adminId,
        },
      });
      await prisma.bloqueo.create({
        data: {
          canchaId: id,
          inicio: new Date(Date.now() + 86400000),
          fin: new Date(Date.now() + 90000000),
          motivo: 'Prueba',
          creadoPorId: adminId,
        },
      });

      await request(servidor())
        .delete(`/api/canchas/${id}`)
        .set('Cookie', cookieAdmin)
        .expect(204);

      expect(await prisma.cancha.findUnique({ where: { id } })).toBeNull();
      expect(await prisma.tarifa.count({ where: { canchaId: id } })).toBe(0);
      expect(await prisma.bloqueo.count({ where: { canchaId: id } })).toBe(0);
      const registros = await auditoriasDe({
        entidadId: id,
        accion: 'ELIMINAR',
      });
      expect(registros).toHaveLength(1);
      expect(registros[0]).toMatchObject({
        usuarioId: adminId,
        detalle: {
          anterior: { id, nombre: nombre('Borrar libre'), activa: true },
          tarifasBorradas: 1,
          bloqueosBorrados: 1,
        },
      });
    });
  });

  describe('permisos', () => {
    it('un JUGADOR recibe 403 en los endpoints de administración', async () => {
      const id = canchasCreadas[0];
      const llamadas = [
        () =>
          request(servidor())
            .post('/api/canchas')
            .send({
              nombre: nombre('Nop'),
              tamano: 'FUTBOL_5',
              iluminacion: true,
            }),
        () =>
          request(servidor())
            .patch(`/api/canchas/${id}`)
            .send({ iluminacion: false }),
        () =>
          request(servidor())
            .patch(`/api/canchas/${id}/activa`)
            .send({ activa: false, confirmar: true }),
        () => request(servidor()).delete(`/api/canchas/${id}`),
      ];

      for (const llamada of llamadas) {
        const res = await llamada().set('Cookie', cookieJugador).expect(403);
        expect(res.body).toMatchObject({
          statusCode: 403,
          message: 'Acceso no autorizado',
        });
      }
    });

    it('sin sesión responde 401', async () => {
      await request(servidor()).get('/api/canchas').expect(401);
    });
  });
});
