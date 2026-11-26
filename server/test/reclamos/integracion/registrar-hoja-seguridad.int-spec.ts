import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { HOJA_REPOSITORY } from '../../../src/modulos/reclamos/dominio/hoja.repository';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import { unaHojaValida } from '../fabricas/datos-de-hoja';

const RUTA = '/api/libro-de-reclamaciones';

describe('POST /api/libro-de-reclamaciones · seguridad', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const registrar = (cuerpo: object) =>
    request(app.getHttpServer()).post(RUTA).send(cuerpo);

  it('rechaza campos que no son del formato, como el titular o el estado', async () => {
    const respuesta = await registrar({
      ...unaHojaValida(),
      titularId: 1,
      estado: 'RESPONDIDA',
    });

    expect(respuesta.status).toBe(400);
    expect(await prisma.hojaDeReclamacion.count()).toBe(0);
  });

  it('rechaza datos que no son texto y un menor de edad que no es sí o no', async () => {
    const respuesta = await registrar({
      ...unaHojaValida(),
      nombres: ['Valeria'],
      detalle: { texto: 'x' },
      esMenorDeEdad: 'si',
    });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toMatchObject({
      nombres: 'Ingresa este dato como texto.',
      detalle: 'Ingresa este dato como texto.',
      esMenorDeEdad: 'Indica si quien reclama es menor de edad.',
    });
  });

  it('un carácter nulo en el texto no provoca un error del servidor', async () => {
    const respuesta = await registrar(unaHojaValida({ detalle: 'hola\u0000' }));

    expect(respuesta.status).toBe(400);
  });

  it('un texto con caracteres de control o un emoji partido responde 400 en su campo', async () => {
    const respuesta = await registrar(
      unaHojaValida({ pedido: 'hola\u0007', domicilio: 'Av. \ud83d' }),
    );

    expect(respuesta.status).toBe(400);
    expect(Object.keys(respuesta.body.errores ?? {})).toEqual(
      expect.arrayContaining(['pedido', 'domicilio']),
    );
  });

  it('si la base falla, responde 500 sin detalles internos', async () => {
    await app.close();
    ({ app } = await crearAppDePrueba((c) =>
      c.overrideProvider(HOJA_REPOSITORY).useValue({
        registrar: () =>
          Promise.reject(new Error('relation "hoja" does not exist')),
      }),
    ));

    const respuesta = await registrar(unaHojaValida());

    expect(respuesta.status).toBe(500);
    expect(JSON.stringify(respuesta.body)).not.toMatch(/relation|stack|hoja"/);
  });

  it('la constancia no expone ids internos ni el hash del código', async () => {
    const { body } = await registrar(unaHojaValida());

    const texto = JSON.stringify(body);
    expect(texto).not.toMatch(/"id"|titularId|Hash|cifrad/i);
  });

  it('limita las hojas por hora desde una misma IP', async () => {
    for (let i = 0; i < 10; i++) {
      expect((await registrar(unaHojaValida())).status).toBe(201);
    }

    expect((await registrar(unaHojaValida())).status).toBe(429);
  });
});
