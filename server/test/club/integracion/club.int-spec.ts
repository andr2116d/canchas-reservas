import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unAdicionalValido } from '../../adicionales/fabricas/datos-adicional';
import { unaCanchaValida } from '../../canchas/fabricas/datos-cancha';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import { sesionDeAdministrador } from '../../compartido/soporte/sesiones-de-prueba';

describe('Lo que se muestra del club', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const comoAdministrador = (
    metodo: 'post' | 'put',
    ruta: string,
    cuerpo: object = {},
  ) =>
    api()
      [metodo](ruta)
      .set('Cookie', administrador)
      .send(cuerpo)
      .expect((r) => {
        if (r.status >= 300) throw new Error(`${ruta} respondió ${r.status}`);
      });

  it('cualquiera, sin sesión, ve las canchas operativas y los adicionales activos, sin lo desactivado', async () => {
    const { body: canchas } = await comoAdministrador('post', '/api/canchas', {
      canchas: [
        unaCanchaValida({ nombre: 'Cancha 1', nota: 'Junto al ingreso.' }),
        unaCanchaValida({ nombre: 'Cancha 2' }),
      ],
    });
    await comoAdministrador(
      'post',
      `/api/canchas/${canchas[1].id}/desactivacion`,
    );
    const { body: balon } = await comoAdministrador(
      'post',
      '/api/adicionales',
      unAdicionalValido(),
    );
    const { body: chalecos } = await comoAdministrador(
      'post',
      '/api/adicionales',
      unAdicionalValido({ nombre: 'Chalecos', precio: '30' }),
    );
    await comoAdministrador(
      'post',
      `/api/adicionales/${chalecos.id}/desactivacion`,
    );

    const { body, text } = await api().get('/api/club').expect(200);

    expect(body.canchas).toEqual([
      {
        id: canchas[0].id,
        nombre: 'Cancha 1',
        tipo: 'FUTBOL_5',
        tieneIluminacion: true,
        caracteristicas: ['BANCAS'],
        nota: 'Junto al ingreso.',
      },
    ]);
    expect(body.adicionales).toEqual([
      {
        nombre: balon.nombre,
        descripcion: 'N.º 5, cuero sintético.',
        precio: '45.00',
      },
    ]);
    expect(text).not.toContain('Valeria');
  });

  it('muestra las tarifas, el horario, el adelanto y la regla vigentes, sin quién los guardó', async () => {
    await comoAdministrador('put', '/api/tarifas/FUTBOL_5', {
      precioDia: '60',
      precioNoche: '80',
      duracionDelTurno: '1',
      ofreceTurnoCorto: false,
    });
    await comoAdministrador('put', '/api/adelanto', { porcentaje: '50' });
    await comoAdministrador('put', '/api/cancelacion/regla', {
      rangos: [
        { desdeHoras: '24', porcentaje: '100', ofreceCredito: true },
        { desdeHoras: '0', porcentaje: '0', ofreceCredito: false },
      ],
    });

    const { body, text } = await api().get('/api/club').expect(200);

    expect(body.tarifas).toEqual([
      {
        tipo: 'FUTBOL_5',
        precioDia: '60.00',
        precioNoche: '80.00',
        duracionDelTurnoHoras: 1,
      },
    ]);
    expect(body.adelanto).toBe(50);
    expect(body.cancelacion).toHaveLength(2);
    expect(body.horario).toBeNull();
    expect(text).not.toContain('Valeria');
  });

  it('solo se consulta y no deja cookies', async () => {
    const respuesta = await api().get('/api/club').expect(200);

    expect(respuesta.headers['set-cookie']).toBeUndefined();
    await api().post('/api/club').send({}).expect(404);
    await api().get('/api/club').query({ x: '1' }).expect(200);
  });
});
