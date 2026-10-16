import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { hash } from 'bcryptjs';
import { Client } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import type { ReglaCancelacion } from '../src/generated/prisma/client';
import type { Rol } from '../src/generated/prisma/enums';
import { AuditoriaService } from '../src/modules/auditoria/auditoria.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('API de regla de cancelación (e2e)', () => {
  const sufijo = String(Date.now());
  const usuarios: number[] = [];
  const cookies = {} as Record<Rol, string>;
  let app: INestApplication;
  let prisma: PrismaService;
  let auditoria: AuditoriaService;
  let original: ReglaCancelacion;
  let canchaId: number | undefined;
  let reservaId: number | undefined;
  let conexion: Client;
  let baseCreada = false;
  const nombreBase = `prueba_regla_${sufijo}`;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
  const leer = () =>
    prisma.reglaCancelacion.findUniqueOrThrow({ where: { id: 1 } });
  const campos = (regla: ReglaCancelacion) => ({
    horasAnticipacion: regla.horasAnticipacion,
    tipoCompensacion: regla.tipoCompensacion,
  });
  const registros = () =>
    prisma.auditoria.findMany({
      where: { usuarioId: { in: usuarios }, entidad: 'REGLA_CANCELACION' },
    });
  const guardar = (datos: object, rol: Rol = 'ADMINISTRADOR') =>
    request(servidor())
      .put('/api/regla-cancelacion')
      .set('Cookie', cookies[rol])
      .send(datos);

  beforeAll(async () => {
    const configuracion = new ConfigService();
    const url = new URL(configuracion.getOrThrow<string>('DATABASE_URL'));
    conexion = new Client({ connectionString: url.toString() });
    await conexion.connect();
    await conexion.query(`CREATE DATABASE "${nombreBase}"`);
    baseCreada = true;
    url.pathname = `/${nombreBase}`;
    const urlPrueba = url.toString();
    const prismaCli = [
      resolve(__dirname, '../node_modules/prisma/build/index.js'),
      resolve(__dirname, '../../node_modules/prisma/build/index.js'),
    ].find((ruta) => existsSync(ruta));
    if (!prismaCli)
      throw new Error('No se encontró el CLI de Prisma instalado');
    execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
      cwd: resolve(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: urlPrueba },
      stdio: 'pipe',
    });
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useFactory({
        factory: () =>
          new PrismaService(new ConfigService({ DATABASE_URL: urlPrueba })),
      })
      .compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);
    auditoria = modulo.get(AuditoriaService);
    await prisma.reglaCancelacion.create({ data: {} });
    original = await leer();
    for (const rol of ['ADMINISTRADOR', 'RECEPCIONISTA', 'JUGADOR'] as const) {
      const correo = `regla.api.${rol.toLowerCase()}.${sufijo}@laprevia.test`;
      const usuario = await prisma.usuario.create({
        data: {
          nombres: 'Prueba Regla',
          tipoDocumento: 'CE',
          numeroDocumento: `${rol[0]}${sufijo}`,
          correo,
          telefono: '900000031',
          passwordHash: await hash('Prueba12345', 4),
          rol,
        },
      });
      usuarios.push(usuario.id);
      const respuesta = await request(servidor())
        .post('/api/auth/login')
        .send({ correo, contrasena: 'Prueba12345' })
        .expect(200);
      const cabecera = respuesta.headers['set-cookie'] as unknown as string[];
      cookies[rol] =
        cabecera.find((cookie) => cookie.startsWith('sesion=')) ?? '';
      expect(cookies[rol]).not.toBe('');
    }
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `Regla API ${sufijo}`,
        tamano: 'FUTBOL_5',
        iluminacion: true,
      },
    });
    canchaId = cancha.id;
    const reserva = await prisma.reserva.create({
      data: {
        codigo: `RA${sufijo}`,
        canchaId,
        jugadorId: usuarios[2],
        creadoPorId: usuarios[2],
        fecha: new Date('2026-11-20'),
        horaInicio: '10:00',
        horaFin: '11:00',
        inicioEn: new Date('2026-11-20T10:00:00-05:00'),
        finEn: new Date('2026-11-20T11:00:00-05:00'),
        franja: 'DIA',
        valorTurno: 60,
        adelantoMinimo: 30,
        reglaHorasAnticipacion: original.horasAnticipacion,
        reglaTipoCompensacion: original.tipoCompensacion,
      },
    });
    reservaId = reserva.id;
  }, 60000);

  afterEach(async () => {
    jest.restoreAllMocks();
    if (prisma && original) {
      await prisma.reglaCancelacion.update({
        where: { id: 1 },
        data: {
          ...campos(original),
          actualizadoEn: original.actualizadoEn,
        },
      });
    }
  });

  afterAll(async () => {
    try {
      if (app) await app.close();
    } finally {
      try {
        if (baseCreada)
          await conexion.query(`DROP DATABASE "${nombreBase}" WITH (FORCE)`);
      } finally {
        if (conexion) await conexion.end();
      }
    }
  });

  it.each(['ADMINISTRADOR', 'RECEPCIONISTA', 'JUGADOR'] as const)(
    'permite consultar a %s y devuelve solo los dos campos',
    async (rol) => {
      const respuesta = await request(servidor())
        .get('/api/regla-cancelacion')
        .set('Cookie', cookies[rol])
        .expect(200);
      expect(respuesta.body).toEqual(campos(original));
    },
  );

  it('rechaza GET y PUT sin sesión', async () => {
    await request(servidor()).get('/api/regla-cancelacion').expect(401);
    await request(servidor())
      .put('/api/regla-cancelacion')
      .send({ horasAnticipacion: 0, tipoCompensacion: 'CREDITO' })
      .expect(401);
  });

  it.each(['JUGADOR', 'RECEPCIONISTA'] as const)(
    'impide actualizar a %s',
    async (rol) => {
      const anterior = await leer();
      const cantidad = (await registros()).length;
      await guardar(
        { horasAnticipacion: 0, tipoCompensacion: 'CREDITO' },
        rol,
      ).expect(403);
      expect(await leer()).toEqual(anterior);
      expect(await registros()).toHaveLength(cantidad);
    },
  );

  it.each([
    { horasAnticipacion: 24, tipoCompensacion: 'CREDITO' },
    { horasAnticipacion: 0, tipoCompensacion: 'CREDITO' },
    { horasAnticipacion: 12, tipoCompensacion: 'DEVOLUCION' },
    { horasAnticipacion: 2147483647, tipoCompensacion: 'CREDITO' },
  ])('guarda y audita %p', async (datos) => {
    const anterior = campos(await leer());
    const previas = (await registros()).map((registro) => registro.id);
    const respuesta = await guardar(datos).expect(200);
    expect(respuesta.body).toEqual(datos);
    expect(campos(await leer())).toEqual(datos);
    const nuevas = (await registros()).filter(
      (registro) => !previas.includes(registro.id),
    );
    expect(nuevas).toHaveLength(1);
    expect(nuevas[0]).toMatchObject({
      usuarioId: usuarios[0],
      accion: 'EDITAR',
      entidad: 'REGLA_CANCELACION',
      entidadId: 1,
      detalle: { anterior, nuevo: datos },
    });
    expect(nuevas[0].fecha).toBeInstanceOf(Date);
  });

  it('la auditoría del cambio queda con la fecha y hora en que se hizo', async () => {
    const toleranciaMs = 2000;
    const previas = (await registros()).map((registro) => registro.id);
    const antes = Date.now();
    await guardar({
      horasAnticipacion: original.horasAnticipacion + 2,
      tipoCompensacion: 'DEVOLUCION',
    }).expect(200);
    const despues = Date.now();
    const [registro] = (await registros()).filter(
      (nuevo) => !previas.includes(nuevo.id),
    );
    expect(registro.usuarioId).toBe(usuarios[0]);
    expect(registro.fecha.getTime()).toBeGreaterThanOrEqual(
      antes - toleranciaMs,
    );
    expect(registro.fecha.getTime()).toBeLessThanOrEqual(
      despues + toleranciaMs,
    );
  });

  it.each([
    undefined,
    null,
    '',
    '24',
    -1,
    1.5,
    true,
    false,
    2147483648,
    Number.MAX_SAFE_INTEGER,
  ])(
    'rechaza horas inválidas %p sin cambiar datos ni auditar',
    async (horas) => {
      const anterior = await leer();
      const cantidad = (await registros()).length;
      const respuesta = await guardar({
        horasAnticipacion: horas,
        tipoCompensacion: 'CREDITO',
      }).expect(400);
      expect(respuesta.body).toMatchObject({
        statusCode: 400,
        message: expect.any(String),
        errores: { horasAnticipacion: expect.any(String) },
      });
      expect(await leer()).toEqual(anterior);
      expect(await registros()).toHaveLength(cantidad);
    },
  );

  it.each([undefined, null, '', 'RETENCION', true])(
    'rechaza compensación inválida %p sin cambiar datos ni auditar',
    async (tipo) => {
      const anterior = await leer();
      const cantidad = (await registros()).length;
      const respuesta = await guardar({
        horasAnticipacion: 24,
        tipoCompensacion: tipo,
      }).expect(400);
      expect(respuesta.body).toMatchObject({
        statusCode: 400,
        errores: { tipoCompensacion: 'Elige Devolución o Crédito' },
      });
      expect(await leer()).toEqual(anterior);
      expect(await registros()).toHaveLength(cantidad);
    },
  );

  it('encadena correctamente la auditoría de actualizaciones simultáneas', async () => {
    const anterior = campos(await leer());
    const idsPrevios = new Set(
      (await registros()).map((registro) => registro.id),
    );
    const cambios = Array.from({ length: 6 }, (_, indice) => ({
      horasAnticipacion: 10 + indice,
      tipoCompensacion: indice % 2 === 0 ? 'CREDITO' : 'DEVOLUCION',
    }));
    const respuestas = await Promise.all(
      cambios.map((datos) => guardar(datos).expect(200)),
    );
    respuestas.forEach((respuesta, indice) =>
      expect(respuesta.body).toEqual(cambios[indice]),
    );
    const nuevas = (await registros())
      .filter((registro) => !idsPrevios.has(registro.id))
      .sort((a, b) => a.id - b.id);
    expect(nuevas).toHaveLength(cambios.length);
    let esperado = anterior;
    for (const registro of nuevas) {
      const detalle = registro.detalle as {
        anterior: typeof anterior;
        nuevo: typeof anterior;
      };
      expect(detalle.anterior).toEqual(esperado);
      expect(cambios).toContainEqual(detalle.nuevo);
      esperado = detalle.nuevo;
    }
    expect(campos(await leer())).toEqual(esperado);
  });

  it('revierte la actualización real si falla auditoría', async () => {
    const anterior = await leer();
    const cantidad = (await registros()).length;
    const spy = jest
      .spyOn(auditoria, 'registrar')
      .mockRejectedValueOnce(new Error('fallo de auditoría'));
    try {
      await guardar({
        horasAnticipacion: anterior.horasAnticipacion + 1,
        tipoCompensacion: 'DEVOLUCION',
      }).expect(500);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(await leer()).toEqual(anterior);
      expect(await registros()).toHaveLength(cantidad);
    } finally {
      spy.mockRestore();
    }
  });

  it('conserva la regla copiada en una reserva existente', async () => {
    await guardar({
      horasAnticipacion: original.horasAnticipacion + 1,
      tipoCompensacion:
        original.tipoCompensacion === 'CREDITO' ? 'DEVOLUCION' : 'CREDITO',
    }).expect(200);
    expect(
      await prisma.reserva.findUniqueOrThrow({ where: { id: reservaId } }),
    ).toMatchObject({
      reglaHorasAnticipacion: original.horasAnticipacion,
      reglaTipoCompensacion: original.tipoCompensacion,
    });
  });
});
