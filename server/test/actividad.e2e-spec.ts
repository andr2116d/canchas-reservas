import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { fechaEnLima, sumarDias } from '../src/common/fechas-lima';
import { Reloj } from '../src/common/reloj/reloj';
import { configurarApp } from '../src/configurar-app';
import type { HorarioDia } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

const HOY = '2030-01-14';
const MANANA = '2030-01-15';
const AHORA = new Date(`${HOY}T10:00:00-05:00`);
const MENSAJE_RANGO = 'La fecha hasta no puede ser anterior a la fecha desde';
const MENSAJE_TAMANO = 'El tamaño de página debe estar entre 1 y 50';

type Rol = 'JUGADOR' | 'RECEPCIONISTA' | 'ADMINISTRADOR';
type Usuario = { id: number; correo: string; nombre: string; cookie: string };

interface Cambio {
  campo: string;
  anterior: string | number | boolean | null;
  nuevo: string | number | boolean | null;
}

interface ItemAuditoria {
  id: number;
  fecha: string;
  usuario: { id: number; nombre: string; rol: Rol } | null;
  accion: string;
  entidad: string;
  entidadId: number | null;
  referencia: string | null;
  motivo: string | null;
  cambios: Cambio[];
}

interface ItemAcceso {
  id: number;
  fecha: string;
  correo: string;
  usuario: { id: number; nombre: string; rol: Rol } | null;
  exito: boolean;
  motivo: 'OK' | 'CREDENCIALES' | 'INACTIVO';
  ip: string | null;
}

interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano: number;
}

describe('Actividad: auditoría y accesos (e2e)', () => {
  const sufijo = String(Date.now()).slice(-9);
  const letras = sufijo.replace(/\d/g, (d) => 'ABCDEFGHIJ'[Number(d)]);
  const contrasena = 'Actividad123';

  let app: INestApplication;
  let prisma: PrismaService;
  let admin: Usuario;
  let recepcion: Usuario;
  let jugador: Usuario;
  let diasOriginales: HorarioDia[];
  let configuracionOriginal: { inicioNoche: string };
  let reglaOriginal: {
    horasAnticipacion: number;
    tipoCompensacion: 'DEVOLUCION' | 'CREDITO';
  };
  let inicio: Date;
  let fin: Date;
  let canchaId: number;
  let reserva: { id: number; codigo: string };
  const usuariosCreados: number[] = [];
  const nombreCancha = `Actividad ${sufijo}`;
  const nombreEditado = `Actividad ${sufijo} B`;
  const correoInexistente = `nadie.${sufijo}@laprevia.test`;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  const cookieDe = (res: request.Response) =>
    ((res.headers['set-cookie'] as unknown as string[] | undefined) ?? []).find(
      (c) => c.startsWith('sesion='),
    ) ?? '';

  const login = (correo: string, clave = contrasena) =>
    request(servidor())
      .post('/api/auth/login')
      .send({ correo, contrasena: clave });

  const crearUsuario = async (rol: Rol): Promise<Usuario> => {
    const n = usuariosCreados.length + 1;
    const correo = `actividad.${sufijo}.${n}@laprevia.test`;
    const usuario = await prisma.usuario.create({
      data: {
        nombres: `Actividad ${n}`,
        apellidos: rol,
        tipoDocumento: 'CE',
        numeroDocumento: `A${sufijo}${n}`,
        correo,
        telefono: '900000090',
        passwordHash: await hash(contrasena, 4),
        rol,
      },
    });
    usuariosCreados.push(usuario.id);
    const res = await login(correo).expect(200);
    return {
      id: usuario.id,
      correo,
      nombre: `Actividad ${n} ${rol}`,
      cookie: cookieDe(res),
    };
  };

  const auditoria = async (
    query: Record<string, string | number>,
    cookie = admin.cookie,
  ) => {
    const res = await request(servidor())
      .get('/api/auditoria')
      .query(query)
      .set('Cookie', cookie)
      .expect(200);
    return res.body as Pagina<ItemAuditoria>;
  };

  const accesos = async (query: Record<string, string | number>) => {
    const res = await request(servidor())
      .get('/api/accesos')
      .query(query)
      .set('Cookie', admin.cookie)
      .expect(200);
    return res.body as Pagina<ItemAcceso>;
  };

  const delAdmin = (accion: string, entidad: string) =>
    auditoria({ usuarioId: admin.id, entidad, accion, tamano: 50 });

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Reloj)
      .useValue({ ahora: () => AHORA })
      .compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);

    diasOriginales = await prisma.horarioDia.findMany();
    configuracionOriginal = await prisma.configuracion.findUniqueOrThrow({
      where: { id: 1 },
      select: { inicioNoche: true },
    });
    reglaOriginal = await prisma.reglaCancelacion.findUniqueOrThrow({
      where: { id: 1 },
      select: { horasAnticipacion: true, tipoCompensacion: true },
    });
    for (let diaSemana = 1; diaSemana <= 7; diaSemana++) {
      const dia = { abierto: true, apertura: '08:00', cierre: '23:00' };
      await prisma.horarioDia.upsert({
        where: { diaSemana },
        update: dia,
        create: { diaSemana, ...dia },
      });
    }
    await prisma.configuracion.update({
      where: { id: 1 },
      data: { inicioNoche: '18:00' },
    });
    await prisma.reglaCancelacion.update({
      where: { id: 1 },
      data: { horasAnticipacion: 24, tipoCompensacion: 'CREDITO' },
    });

    inicio = new Date(Date.now() - 1000);
    admin = await crearUsuario('ADMINISTRADOR');
    recepcion = await crearUsuario('RECEPCIONISTA');
    jugador = await crearUsuario('JUGADOR');
    await login(jugador.correo, 'incorrecta1').expect(401);
    await login(correoInexistente).expect(401);

    const creada = await request(servidor())
      .post('/api/canchas')
      .set('Cookie', admin.cookie)
      .send({ nombre: nombreCancha, tamano: 'FUTBOL_5', iluminacion: true })
      .expect(201);
    canchaId = (creada.body as { id: number }).id;
    await request(servidor())
      .patch(`/api/canchas/${canchaId}`)
      .set('Cookie', admin.cookie)
      .send({ nombre: nombreEditado })
      .expect(200);
    for (const valor of [80, 90.5]) {
      await request(servidor())
        .put(`/api/canchas/${canchaId}/tarifas`)
        .set('Cookie', admin.cookie)
        .send({ franja: 'NOCHE', valor })
        .expect(200);
    }
    const dias = Array.from({ length: 7 }, (_, i) =>
      i === 6
        ? { diaSemana: 7, abierto: false }
        : {
            diaSemana: i + 1,
            abierto: true,
            apertura: '08:00',
            cierre: '23:00',
          },
    );
    await request(servidor())
      .put('/api/horario')
      .set('Cookie', admin.cookie)
      .send({ dias, inicioNoche: '18:00', confirmar: true })
      .expect(200);
    await request(servidor())
      .put('/api/regla-cancelacion')
      .set('Cookie', admin.cookie)
      .send({ horasAnticipacion: 12, tipoCompensacion: 'DEVOLUCION' })
      .expect(200);
    const reservada = await request(servidor())
      .post('/api/reservas')
      .set('Cookie', jugador.cookie)
      .send({
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
        usarCredito: false,
      })
      .expect(201);
    reserva = reservada.body as { id: number; codigo: string };
    fin = new Date(Date.now() + 1000);
  });

  afterAll(async () => {
    await prisma.reserva.deleteMany({ where: { canchaId } });
    await prisma.tarifa.deleteMany({ where: { canchaId } });
    await prisma.cancha.deleteMany({ where: { id: canchaId } });
    await prisma.registroAcceso.deleteMany({
      where: { correo: { contains: sufijo } },
    });
    await prisma.usuario.deleteMany({
      where: { id: { in: usuariosCreados }, auditorias: { none: {} } },
    });
    for (const { diaSemana, abierto, apertura, cierre } of diasOriginales) {
      await prisma.horarioDia.update({
        where: { diaSemana },
        data: { abierto, apertura, cierre },
      });
    }
    await prisma.horarioDia.deleteMany({
      where: { diaSemana: { notIn: diasOriginales.map((d) => d.diaSemana) } },
    });
    await prisma.configuracion.update({
      where: { id: 1 },
      data: configuracionOriginal,
    });
    await prisma.reglaCancelacion.update({
      where: { id: 1 },
      data: reglaOriginal,
    });
    await app.close();
  });

  const enVentana = (fecha: string) => {
    const instante = new Date(fecha).getTime();
    expect(instante).toBeGreaterThanOrEqual(inicio.getTime());
    expect(instante).toBeLessThanOrEqual(fin.getTime());
  };

  const usuarioAdmin = () => ({
    id: admin.id,
    nombre: admin.nombre,
    rol: 'ADMINISTRADOR',
  });

  describe('GET /api/auditoria', () => {
    it('crear y editar la cancha quedan con fecha, usuario y cambios', async () => {
      const { items } = await auditoria({
        entidad: 'CANCHA',
        usuarioId: admin.id,
      });

      expect(items.map((i) => i.accion)).toEqual(['EDITAR', 'CREAR']);
      const [editar, crear] = items;
      expect(editar).toMatchObject({
        usuario: usuarioAdmin(),
        entidad: 'CANCHA',
        entidadId: canchaId,
        referencia: nombreEditado,
        motivo: null,
        cambios: [
          { campo: 'nombre', anterior: nombreCancha, nuevo: nombreEditado },
        ],
      });
      expect(crear.cambios).toEqual([
        { campo: 'nombre', anterior: null, nuevo: nombreCancha },
        { campo: 'tamano', anterior: null, nuevo: 'FUTBOL_5' },
        { campo: 'iluminacion', anterior: null, nuevo: true },
        { campo: 'estado', anterior: null, nuevo: 'OPERATIVA' },
        { campo: 'activa', anterior: null, nuevo: true },
      ]);
      items.forEach((i) => enVentana(i.fecha));
    });

    it('el cambio de tarifa queda con valor anterior y nuevo y la cancha y franja', async () => {
      const { items } = await auditoria({
        entidad: 'TARIFA',
        usuarioId: admin.id,
      });

      expect(items).toEqual([
        expect.objectContaining({
          accion: 'EDITAR',
          usuario: usuarioAdmin(),
          referencia: `${nombreEditado} · Noche`,
          cambios: [{ campo: 'valor', anterior: 80, nuevo: 90.5 }],
        }),
        expect.objectContaining({
          accion: 'CREAR',
          referencia: `${nombreEditado} · Noche`,
          cambios: [{ campo: 'valor', anterior: null, nuevo: 80 }],
        }),
      ]);
      items.forEach((i) => enVentana(i.fecha));
    });

    it('el cambio de horario muestra el día que cerró', async () => {
      const [horario] = (await delAdmin('EDITAR', 'HORARIO')).items;

      expect(horario).toMatchObject({
        usuario: usuarioAdmin(),
        entidadId: null,
        referencia: 'Horario',
        cambios: [
          { campo: 'dia.7', anterior: '08:00-23:00', nuevo: 'CERRADO' },
        ],
      });
      enVentana(horario.fecha);
    });

    it('el cambio de la regla muestra valores anteriores y nuevos', async () => {
      const [regla] = (await delAdmin('EDITAR', 'REGLA_CANCELACION')).items;

      expect(regla).toMatchObject({
        usuario: usuarioAdmin(),
        referencia: 'Regla de cancelación',
        cambios: [
          { campo: 'horasAnticipacion', anterior: 24, nuevo: 12 },
          {
            campo: 'tipoCompensacion',
            anterior: 'CREDITO',
            nuevo: 'DEVOLUCION',
          },
        ],
      });
      enVentana(regla.fecha);
    });

    it('la reserva queda con el jugador, su código y los montos', async () => {
      const { items, total } = await auditoria({
        entidad: 'RESERVA',
        usuarioId: jugador.id,
      });

      expect(total).toBe(1);
      expect(items[0]).toMatchObject({
        accion: 'CREAR',
        usuario: { id: jugador.id, nombre: jugador.nombre, rol: 'JUGADOR' },
        entidadId: reserva.id,
        referencia: reserva.codigo,
        cambios: [
          { campo: 'cancha', anterior: null, nuevo: nombreEditado },
          { campo: 'fecha', anterior: null, nuevo: MANANA },
          { campo: 'horaInicio', anterior: null, nuevo: '18:00' },
          { campo: 'valorTurno', anterior: null, nuevo: 90.5 },
          { campo: 'adelantoMinimo', anterior: null, nuevo: 45.25 },
        ],
      });
      enVentana(items[0].fecha);
    });

    it('filtra por usuario, entidad y acción', async () => {
      const todos = await auditoria({ usuarioId: admin.id });
      const ediciones = await auditoria({
        usuarioId: admin.id,
        accion: 'EDITAR',
      });

      expect(todos.total).toBe(6);
      expect(todos.items.map((i) => `${i.entidad} ${i.accion}`)).toEqual([
        'REGLA_CANCELACION EDITAR',
        'HORARIO EDITAR',
        'TARIFA EDITAR',
        'TARIFA CREAR',
        'CANCHA EDITAR',
        'CANCHA CREAR',
      ]);
      expect(ediciones.total).toBe(4);
      expect(ediciones.items.every((i) => i.accion === 'EDITAR')).toBe(true);
    });

    it('pagina del más reciente al más antiguo sin repetir filas', async () => {
      const todos = await auditoria({ usuarioId: admin.id });
      const paginas = await Promise.all(
        [1, 2, 3, 4].map((pagina) =>
          auditoria({ usuarioId: admin.id, tamano: 2, pagina }),
        ),
      );

      expect(paginas.map((p) => p.items.length)).toEqual([2, 2, 2, 0]);
      expect(paginas[1]).toMatchObject({ total: 6, pagina: 2, tamano: 2 });
      expect(paginas.flatMap((p) => p.items.map((i) => i.id))).toEqual(
        todos.items.map((i) => i.id),
      );
    });

    it('sin tamano devuelve 20 por página', async () => {
      const respuesta = await auditoria({});

      expect(respuesta).toMatchObject({ pagina: 1, tamano: 20 });
      expect(respuesta.items.length).toBeLessThanOrEqual(20);
    });

    it('el rango de fechas usa los días de Lima, con ambos extremos inclusive', async () => {
      const entidad = `PRUEBA_${letras}`;
      for (const fecha of [
        '2001-03-10T04:30:00.000Z',
        '2001-03-10T05:30:00.000Z',
        '2001-03-11T04:59:00.000Z',
        '2001-03-11T05:00:00.000Z',
      ]) {
        await prisma.auditoria.create({
          data: {
            fecha: new Date(fecha),
            accion: 'PROBAR',
            entidad,
            detalle: { lugar: fecha },
          },
        });
      }

      const lugares = async (desde: string, hasta: string) =>
        (await auditoria({ entidad, desde, hasta })).items.flatMap((i) =>
          i.cambios.map((c) => c.nuevo),
        );

      expect(await lugares('2001-03-09', '2001-03-09')).toEqual([
        '2001-03-10T04:30:00.000Z',
      ]);
      expect(await lugares('2001-03-10', '2001-03-10')).toEqual([
        '2001-03-11T04:59:00.000Z',
        '2001-03-10T05:30:00.000Z',
      ]);
      expect(await lugares('2001-03-11', '2001-03-12')).toEqual([
        '2001-03-11T05:00:00.000Z',
      ]);
      const sistema = (await auditoria({ entidad })).items[0];
      expect(sistema).toMatchObject({
        usuario: null,
        referencia: null,
        cambios: [
          { campo: 'lugar', anterior: null, nuevo: '2001-03-11T05:00:00.000Z' },
        ],
      });
    });

    it('lo de hoy aparece filtrando por la fecha de hoy en Lima', async () => {
      const hoy = fechaEnLima(new Date());
      const deHoy = await auditoria({
        usuarioId: admin.id,
        desde: hoy,
        hasta: hoy,
      });
      const deAyer = await auditoria({
        usuarioId: admin.id,
        hasta: sumarDias(hoy, -1),
      });

      expect(deHoy.total).toBe(6);
      expect(deAyer.total).toBe(0);
    });

    it('responde 400 con errores por campo', async () => {
      const invertido = await request(servidor())
        .get('/api/auditoria')
        .query({ desde: '2026-10-16', hasta: '2026-10-15', tamano: 51 })
        .set('Cookie', admin.cookie)
        .expect(400);

      expect(invertido.body).toEqual({
        statusCode: 400,
        message: expect.any(String) as string,
        errores: { hasta: MENSAJE_RANGO, tamano: MENSAJE_TAMANO },
      });
    });
  });

  describe('GET /api/accesos', () => {
    it('muestra el login correcto y el fallido del jugador con fecha y usuario', async () => {
      const { items, total } = await accesos({ correo: jugador.correo });

      expect(total).toBe(2);
      expect(items).toEqual([
        expect.objectContaining({
          correo: jugador.correo,
          usuario: { id: jugador.id, nombre: jugador.nombre, rol: 'JUGADOR' },
          exito: false,
          motivo: 'CREDENCIALES',
        }),
        expect.objectContaining({
          correo: jugador.correo,
          exito: true,
          motivo: 'OK',
        }),
      ]);
      items.forEach((i) => enVentana(i.fecha));
    });

    it('un correo que no existe queda sin usuario', async () => {
      const { items } = await accesos({ correo: correoInexistente });

      expect(items).toEqual([
        expect.objectContaining({
          correo: correoInexistente,
          usuario: null,
          exito: false,
          motivo: 'CREDENCIALES',
        }),
      ]);
    });

    it('filtra por resultado y por parte del correo sin distinguir mayúsculas', async () => {
      const rechazados = await accesos({
        correo: `ACTIVIDAD.${sufijo}`,
        exito: 'false',
      });
      const entraron = await accesos({
        correo: `actividad.${sufijo}`,
        exito: 'true',
      });

      expect(rechazados.items.map((i) => i.correo)).toEqual([jugador.correo]);
      expect(entraron.total).toBe(3);
      expect(entraron.items.every((i) => i.exito)).toBe(true);
    });

    it('los comodines del correo se buscan como texto', async () => {
      const { items } = await accesos({ correo: '%', tamano: 50 });

      expect(items.every((i) => i.correo.includes('%'))).toBe(true);
    });

    it('pagina y filtra por fechas de Lima', async () => {
      const hoy = fechaEnLima(new Date());
      const pagina2 = await accesos({
        correo: sufijo,
        desde: hoy,
        hasta: hoy,
        tamano: 2,
        pagina: 2,
      });
      const deManana = await accesos({
        correo: sufijo,
        desde: sumarDias(hoy, 1),
      });

      expect(pagina2).toMatchObject({ total: 5, pagina: 2, tamano: 2 });
      expect(pagina2.items).toHaveLength(2);
      expect(deManana.total).toBe(0);
    });

    it('responde 400 si el resultado no es true ni false', async () => {
      const res = await request(servidor())
        .get('/api/accesos')
        .query({ exito: 'si' })
        .set('Cookie', admin.cookie)
        .expect(400);

      expect((res.body as { errores: object }).errores).toHaveProperty('exito');
    });
  });

  describe('permisos', () => {
    it.each(['/api/auditoria', '/api/accesos'])(
      '%s responde 403 a recepcionista y jugador, y 401 sin sesión',
      async (ruta) => {
        await request(servidor())
          .get(ruta)
          .set('Cookie', recepcion.cookie)
          .expect(403);
        await request(servidor())
          .get(ruta)
          .set('Cookie', jugador.cookie)
          .expect(403);
        await request(servidor()).get(ruta).expect(401);
      },
    );
  });
});
