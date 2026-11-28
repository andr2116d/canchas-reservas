import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unJugadorValido } from '../fabricas/datos-registro-jugador';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';

const RUTA = '/api/jugadores';

describe('POST /api/jugadores', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  // Una app nueva por prueba: el límite de intentos se cuenta por instancia.
  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const registrar = (cuerpo: object) =>
    request(app.getHttpServer()).post(RUTA).send(cuerpo);

  describe('registro exitoso', () => {
    it('guarda la versión aceptada, el momento y el canal del registro', async () => {
      const respuesta = await registrar({
        ...unJugadorValido(),
        versionLegalAceptada: '2026-11-24',
      });

      expect(respuesta.status).toBe(201);
      const usuario = await prisma.usuario.findFirstOrThrow();
      expect(usuario).toMatchObject({
        versionLegalAceptada: '2026-11-24',
        canalAceptacionLegal: 'web',
        aceptacionLegalEn: expect.any(Date),
      });
    });

    it('rechaza la versión anterior de los documentos y pide revisarlos de nuevo', async () => {
      const respuesta = await registrar({
        ...unJugadorValido(),
        versionLegalAceptada: 'registro-1',
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.errores.versionLegalAceptada).toBe(
        'Los documentos han cambiado. Recarga la página y revísalos.',
      );
    });

    it('responde 201 con los nombres del jugador', async () => {
      const respuesta = await registrar(unJugadorValido());

      expect(respuesta.status).toBe(201);
      expect(respuesta.body).toEqual({ nombres: 'Valeria' });
    });

    it('guarda el dorsal elegido, sin cifrar porque no es un dato personal', async () => {
      await registrar(unJugadorValido({ dorsal: '7' }));

      expect((await prisma.usuario.findFirstOrThrow()).dorsal).toBe(7);
    });

    it('crea al usuario con rol jugador y estado activo', async () => {
      await registrar(unJugadorValido());

      const usuarios = await prisma.usuario.findMany();
      expect(usuarios).toHaveLength(1);
      expect(usuarios[0].rol).toBe('JUGADOR');
      expect(usuarios[0].estado).toBe('ACTIVO');
    });

    it('guarda documento, celular, correo y nombres cifrados, y la contraseña con hash', async () => {
      const datos = unJugadorValido();
      await registrar(datos);

      const fila = JSON.stringify(await prisma.usuario.findFirstOrThrow());
      for (const dato of [
        datos.nombres,
        datos.apellidos,
        datos.fechaNacimiento,
        datos.numeroDocumento,
        datos.celular,
        datos.correo,
        datos.contrasena,
      ]) {
        expect(fila).not.toContain(dato);
      }
      expect(fila).toContain('$argon2id$');
    });
  });

  describe('datos repetidos', () => {
    it('responde 409 si el documento ya tiene cuenta', async () => {
      await registrar(unJugadorValido());

      const respuesta = await registrar(
        unJugadorValido({ correo: 'otra.persona@gmail.com' }),
      );

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.errores).toEqual({
        numeroDocumento: 'Ya existe una cuenta con este documento.',
      });
    });

    it('responde 409 si el correo ya tiene cuenta', async () => {
      await registrar(unJugadorValido());

      const respuesta = await registrar(
        unJugadorValido({ numeroDocumento: '11223344' }),
      );

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.errores).toEqual({
        correo: 'Ya existe una cuenta con este correo.',
      });
    });
  });

  describe('idempotencia', () => {
    it('cinco envíos iguales al mismo tiempo crean una sola cuenta y una sola sesión', async () => {
      const respuestas = await Promise.all(
        Array.from({ length: 5 }, () => registrar(unJugadorValido())),
      );

      const estados = respuestas
        .map(({ status }) => status)
        .sort((a, b) => a - b);
      expect(estados).toEqual([201, 409, 409, 409, 409]);
      expect(await prisma.usuario.count()).toBe(1);
      expect(await prisma.sesion.count()).toBe(1);
    });

    it('dos personas con el mismo documento al mismo tiempo: solo una queda registrada', async () => {
      const respuestas = await Promise.all([
        registrar(unJugadorValido({ correo: 'primera@gmail.com' })),
        registrar(unJugadorValido({ correo: 'segunda@gmail.com' })),
      ]);

      expect(
        respuestas.map(({ status }) => status).sort((a, b) => a - b),
      ).toEqual([201, 409]);
      const rechazo = respuestas.find(({ status }) => status === 409);
      expect(rechazo?.body.errores).toEqual({
        numeroDocumento: 'Ya existe una cuenta con este documento.',
      });
      expect(await prisma.usuario.count()).toBe(1);
    });

    it('repetir el registro ya hecho no crea otra cuenta', async () => {
      await registrar(unJugadorValido());

      const repetido = await registrar(unJugadorValido());

      expect(repetido.status).toBe(409);
      expect(await prisma.usuario.count()).toBe(1);
      expect(await prisma.sesion.count()).toBe(1);
    });
  });

  describe('datos inválidos', () => {
    it.each([undefined, 'registro-0'])(
      'rechaza la aceptación legal %s',
      async (version) => {
        const respuesta = await registrar({
          ...unJugadorValido(),
          versionLegalAceptada: version,
        });

        expect(respuesta.status).toBe(400);
        expect(respuesta.body.errores.versionLegalAceptada).toBeDefined();
        expect(await prisma.usuario.count()).toBe(0);
        expect(await prisma.sesion.count()).toBe(0);
      },
    );

    it('responde 400 con el mensaje de cada campo inválido y no guarda nada', async () => {
      const respuesta = await registrar(
        unJugadorValido({
          numeroDocumento: '4567891A',
          celular: '044123456',
          correo: 'valeria@',
          contrasena: 'corta1',
        }),
      );

      expect(respuesta.status).toBe(400);
      expect(respuesta.body).toEqual({
        statusCode: 400,
        message: 'Revisa los datos marcados.',
        mensaje: 'Revisa los datos marcados.',
        errores: {
          numeroDocumento: 'El DNI solo debe contener números.',
          celular: 'El celular debe empezar con 9.',
          correo: 'El correo no tiene un formato válido.',
          contrasena: 'La contraseña debe tener al menos 8 caracteres.',
        },
      });
      expect(await prisma.usuario.count()).toBe(0);
    });

    it('rechaza un dorsal fuera del rango', async () => {
      const respuesta = await registrar(unJugadorValido({ dorsal: '100' }));

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.errores).toEqual({
        dorsal: 'El dorsal debe estar entre 1 y 99.',
      });
    });

    it('rechaza a un menor de 18 años', async () => {
      const respuesta = await registrar(
        unJugadorValido({ fechaNacimiento: '2012-03-10' }),
      );

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.errores).toEqual({
        fechaNacimiento: 'Debe tener al menos 18 años.',
      });
      expect(await prisma.usuario.count()).toBe(0);
    });

    it('rechaza un correo del dominio del local, reservado al personal', async () => {
      const respuesta = await registrar(
        unJugadorValido({ correo: 'valeria@laprevia.pe' }),
      );

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.errores).toEqual({
        correo:
          'Usa un correo personal: @laprevia.pe es solo para el personal del local.',
      });
      expect(await prisma.usuario.count()).toBe(0);
    });

    it('rechaza un tipo de documento que no existe', async () => {
      const respuesta = await registrar(
        unJugadorValido({ tipoDocumento: 'PASAPORTE' }),
      );

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.errores.tipoDocumento).toBe(
        'Elige el tipo de documento.',
      );
    });

    it('rechaza campos que no son del registro, como un rol elegido por la persona', async () => {
      const respuesta = await registrar({
        ...unJugadorValido(),
        rol: 'ADMINISTRADOR',
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.errores).toEqual({
        rol: 'Este campo no está permitido.',
      });
      expect(await prisma.usuario.count()).toBe(0);
    });

    it('rechaza un dato que no es texto', async () => {
      const respuesta = await registrar(
        unJugadorValido({ celular: 987654321 as never }),
      );

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.errores.celular).toBe(
        'Ingresa este dato como texto.',
      );
    });
  });
});
