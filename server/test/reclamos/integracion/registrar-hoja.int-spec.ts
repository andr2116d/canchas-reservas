import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { fechaEnLima } from '../../../src/compartido/dominio/momento-en-lima';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { esperarCorreos } from '../../compartido/soporte/bandeja-de-mailpit';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';
import { unaHojaValida } from '../fabricas/datos-de-hoja';

const RUTA = '/api/libro-de-reclamaciones';
const ANIO = fechaEnLima(new Date()).slice(0, 4);

describe('POST /api/libro-de-reclamaciones', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const registrar = (cuerpo: object, cookie?: string) => {
    const pedido = request(app.getHttpServer()).post(RUTA);
    if (cookie) pedido.set('Cookie', cookie);
    return pedido.send(cuerpo);
  };

  it('sin cuenta registra la hoja y responde 201 con su constancia', async () => {
    const respuesta = await registrar(unaHojaValida());

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({
      numero: `000001-${ANIO}`,
      codigo: expect.stringMatching(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/),
      fechaLimite: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      proveedor: { razonSocial: null, ruc: null, direccion: null },
      hoja: {
        tipo: 'RECLAMO',
        consumidor: { nombres: 'Valeria', correo: 'valeria.leon@gmail.com' },
      },
    });
  });

  it('guarda los datos personales y los textos cifrados, y el código solo como hash', async () => {
    const { body } = await registrar(unaHojaValida());

    const fila = await prisma.hojaDeReclamacion.findFirstOrThrow();
    const guardado = JSON.stringify(fila);
    for (const texto of [
      'Valeria',
      'León',
      '45871236',
      'gmail.com',
      'América',
      'ocupada',
    ]) {
      expect(guardado).not.toContain(texto);
    }
    expect(guardado).not.toContain(body.codigo.replace('-', ''));
    expect(fila).toMatchObject({
      estado: 'NUEVA',
      titularId: null,
      correlativo: 1,
    });
  });

  it('envía la copia de la hoja al correo de quien reclama', async () => {
    const correo = `reclama.${randomUUID()}@gmail.com`;

    const { body } = await registrar(unaHojaValida({ correo }));

    const [copia] = await esperarCorreos(correo);
    expect(copia.asunto).toBe(`Hoja de reclamación N.º ${body.numero}`);
    expect(copia.texto).toContain(`Código de seguimiento: ${body.codigo}`);
  });

  it('con sesión de jugador, la hoja queda en su cuenta', async () => {
    const cookie = await sesionDeJugador(app);

    await registrar(unaHojaValida(), cookie);

    const fila = await prisma.hojaDeReclamacion.findFirstOrThrow();
    const jugador = await prisma.usuario.findFirstOrThrow({
      where: { rol: 'JUGADOR' },
    });
    expect(fila.titularId).toBe(jugador.id);
  });

  it('con sesión del personal o una cookie vencida, registra igual sin cuenta', async () => {
    const administracion = await sesionDeAdministrador(app);

    const conPersonal = await registrar(unaHojaValida(), administracion);
    const conCookieFalsa = await registrar(unaHojaValida(), 'sesion=no-existe');

    expect([conPersonal.status, conCookieFalsa.status]).toEqual([201, 201]);
    const filas = await prisma.hojaDeReclamacion.findMany();
    expect(filas.map((f) => f.titularId)).toEqual([null, null]);
  });

  it('con datos que faltan responde 400 con el error de cada campo y no guarda nada', async () => {
    const respuesta = await registrar(
      unaHojaValida({ nombres: '', detalle: '' }),
    );

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual({
      nombres: 'Ingresa los nombres.',
      detalle: 'Ingresa el detalle.',
    });
    expect(await prisma.hojaDeReclamacion.count()).toBe(0);
  });

  it('varias hojas a la vez reciben números distintos y seguidos', async () => {
    const respuestas = await Promise.all(
      Array.from({ length: 5 }, () => registrar(unaHojaValida())),
    );

    const numeros = respuestas
      .map((r) => String(r.body.numero))
      .sort((a, b) => a.localeCompare(b));
    expect(numeros).toEqual([1, 2, 3, 4, 5].map((n) => `00000${n}-${ANIO}`));
  });

  it('la base no deja borrar una hoja', async () => {
    await registrar(unaHojaValida());

    await expect(prisma.hojaDeReclamacion.deleteMany()).rejects.toThrow(
      'Las hojas de reclamación no se borran.',
    );
  });
});
