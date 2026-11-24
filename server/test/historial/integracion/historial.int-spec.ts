import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { fechaEnLima } from '../../../src/compartido/dominio/momento-en-lima';
import { unAdicionalValido } from '../../adicionales/fabricas/datos-adicional';
import { unaCanchaValida } from '../../canchas/fabricas/datos-cancha';
import { unaRecepcionistaValida } from '../../usuarios/fabricas/datos-recepcionista';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';

interface Registro {
  id: string;
  categoria: string;
  accion: string;
  importante: boolean;
  sujeto: string | null;
  autor: { id: number; nombre: string };
  detalle: { campo: string; antes: string | null; despues: string | null }[];
}
interface Pagina {
  registros: Registro[];
  total: number;
  pagina: number;
  porPagina: number;
  paginas: number;
}

const TARIFA = {
  precioDia: '50',
  precioNoche: '100',
  duracionDelTurno: '2',
  ofreceTurnoCorto: false,
};

describe('Historial de cambios', () => {
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
    cuerpo: object,
  ) =>
    api()
      [metodo](ruta)
      .set('Cookie', administrador)
      .send(cuerpo)
      .expect((r) => {
        if (r.status >= 300) throw new Error(`${ruta} respondió ${r.status}`);
      });
  const consultar = async (filtros: Record<string, string> = {}) =>
    (
      await api()
        .get('/api/historial')
        .query(filtros)
        .set('Cookie', administrador)
        .expect(200)
    ).body as Pagina;

  it('reúne los cambios de cada fuente, lo más reciente primero, con quién y qué cambió', async () => {
    await comoAdministrador('put', '/api/tarifas/FUTBOL_7', TARIFA);
    await comoAdministrador('put', '/api/tarifas/FUTBOL_7', {
      ...TARIFA,
      precioDia: '55',
    });
    await comoAdministrador('post', '/api/canchas', {
      canchas: [unaCanchaValida()],
    });
    await comoAdministrador('post', '/api/adicionales', unAdicionalValido());

    const { registros } = await consultar();

    expect(registros.map((r) => [r.categoria, r.accion])).toEqual([
      ['ADICIONALES', 'ALTA'],
      ['CANCHAS', 'ALTA'],
      ['TARIFAS', 'EDICION'],
      ['TARIFAS', 'ALTA'],
      ['CUENTAS', 'CAMBIO_DE_CONTRASENA'],
      ['ACCESOS', 'INICIO_DE_SESION'],
    ]);
    expect(registros[2]).toMatchObject({
      sujeto: 'Fútbol 7',
      importante: true,
      autor: { nombre: 'Valeria León Paredes' },
      detalle: [
        { campo: 'Precio de día', antes: 'S/ 50.00', despues: 'S/ 55.00' },
      ],
    });
  });

  it('las cuentas del personal muestran a quién se cambió; los accesos de jugadores no aparecen', async () => {
    const { body } = await comoAdministrador(
      'post',
      '/api/recepcionistas',
      unaRecepcionistaValida(),
    );
    await comoAdministrador(
      'post',
      `/api/recepcionistas/${body.id}/desactivacion`,
      {},
    );
    await sesionDeJugador(app);

    const { registros } = await consultar({ categoria: 'CUENTAS' });
    const accesos = await consultar({ categoria: 'ACCESOS' });

    expect(registros.map((r) => [r.accion, r.sujeto, r.importante])).toEqual([
      ['DESACTIVACION', 'Rosa Quispe Lozano', true],
      ['ALTA', 'Rosa Quispe Lozano', false],
      ['CAMBIO_DE_CONTRASENA', 'Valeria León Paredes', true],
    ]);
    expect(accesos.total).toBe(1);
  });

  it('combina filtros de categoría, acción, persona e importancia', async () => {
    await comoAdministrador('put', '/api/tarifas/FUTBOL_5', TARIFA);
    await comoAdministrador('post', '/api/canchas', {
      canchas: [unaCanchaValida()],
    });
    const yo = (await consultar()).registros[0].autor.id;

    const importantes = await consultar({
      soloImportantes: 'true',
      autor: String(yo),
    });
    const altasDeCanchas = await consultar({
      categoria: 'CANCHAS',
      accion: 'ALTA',
    });

    // Importantes: la tarifa y el cambio de la contraseña temporal del administrador.
    expect(importantes.registros.map((r) => r.categoria)).toEqual([
      'TARIFAS',
      'CUENTAS',
    ]);
    expect(altasDeCanchas.total).toBe(1);
  });

  it('filtra por días de Lima y dice cuando nada cumple', async () => {
    const hoy = fechaEnLima(new Date());

    // El inicio de sesión del administrador y el cambio de su contraseña temporal.
    expect((await consultar({ desde: hoy, hasta: hoy })).total).toBe(2);
    expect(await consultar({ desde: '2099-01-01' })).toMatchObject({
      registros: [],
      total: 0,
      paginas: 0,
    });
  });

  it('si la fecha final es anterior a la inicial no filtra y dice por qué', async () => {
    const { body } = await api()
      .get('/api/historial')
      .query({ desde: '2026-11-24', hasta: '2026-11-20' })
      .set('Cookie', administrador)
      .expect(400);

    expect(body.errores).toEqual({
      hasta:
        'La fecha final es anterior a la inicial: elige una fecha desde el 24/11/2026.',
    });
  });

  it('entrega de a pocos: la página pedida y el total', async () => {
    const canchas = Array.from({ length: 12 }, (_, i) =>
      unaCanchaValida({ nombre: `Cancha ${i + 1}` }),
    );
    await comoAdministrador('post', '/api/canchas', { canchas });

    const segunda = await consultar({ porPagina: '10', pagina: '2' });
    const antiguos = await consultar({ porPagina: '10', orden: 'ANTIGUOS' });

    expect(segunda).toMatchObject({
      total: 14,
      pagina: 2,
      porPagina: 10,
      paginas: 2,
    });
    expect(segunda.registros).toHaveLength(4);
    expect(antiguos.registros[0].categoria).toBe('ACCESOS');
  });

  it('lista a quienes tienen registros, para filtrar por persona', async () => {
    const { body } = await api()
      .get('/api/historial/autores')
      .set('Cookie', administrador)
      .expect(200);

    expect(body).toEqual([
      {
        id: expect.any(Number),
        nombre: 'Valeria León Paredes',
        rol: 'ADMINISTRADOR',
      },
    ]);
  });
});
