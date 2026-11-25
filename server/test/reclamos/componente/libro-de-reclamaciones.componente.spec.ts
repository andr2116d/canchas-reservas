import type { NestExpressApplication } from '@nestjs/platform-express';
import { crearComponenteDePrueba } from '../../compartido/soporte/crear-componente-de-prueba';
import { unaHojaValida } from '../fabricas/datos-de-hoja';

describe('Libro de Reclamaciones · componente', () => {
  let componente: Awaited<ReturnType<typeof crearComponenteDePrueba>>;
  let app: NestExpressApplication;

  beforeEach(async () => {
    componente = await crearComponenteDePrueba();
    app = componente.app;
  });
  afterEach(() => app.close());

  const registrar = (cuerpo: object, cookie?: string) => {
    const pedido = componente.api().post('/api/libro-de-reclamaciones');
    if (cookie) pedido.set('Cookie', cookie);
    return pedido.send(cuerpo);
  };

  it('responde 201 con la constancia y deja la copia en la bandeja de salida', async () => {
    const respuesta = await registrar(unaHojaValida());

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.numero).toBe('000001-2026');
    expect(componente.dobles.bandeja.correos.map((c) => c.para)).toEqual([
      'valeria.leon@gmail.com',
    ]);
  });

  it('solo liga la hoja a una cuenta de jugador, nunca a una del personal', async () => {
    await registrar(
      unaHojaValida(),
      componente.como('JUGADOR', { usuarioId: 8 }),
    );
    await registrar(
      unaHojaValida(),
      componente.como('ADMINISTRADOR', { usuarioId: 3 }),
    );
    await registrar(
      unaHojaValida(),
      componente.como('RECEPCIONISTA', { usuarioId: 4 }),
    );

    expect(componente.dobles.hojas.guardadas.map((h) => h.titularId)).toEqual([
      8,
      null,
      null,
    ]);
  });

  it.each([
    ['tipo', 'SUGERENCIA', 'Elige si es un reclamo o una queja.'],
    ['servicio', 'BAR', 'Elige el servicio contratado.'],
    ['medioDeRespuesta', 'WHATSAPP', 'Elige cómo recibir la respuesta.'],
    ['tipoDocumento', 'PASAPORTE', 'Elige el tipo de documento.'],
  ])(
    'una opción que no existe en %s responde 400 con su mensaje',
    async (campo, valor, mensaje) => {
      const respuesta = await registrar({ ...unaHojaValida(), [campo]: valor });

      expect(respuesta.status).toBe(400);
      expect(Object.values(respuesta.body.errores)).toContain(mensaje);
    },
  );

  it('un cuerpo que no es JSON se rechaza', async () => {
    const respuesta = await componente
      .api()
      .post('/api/libro-de-reclamaciones')
      .type('form')
      .send('nombres=Valeria');

    expect([400, 415]).toContain(respuesta.status);
    expect(componente.dobles.hojas.guardadas).toHaveLength(0);
  });
});
