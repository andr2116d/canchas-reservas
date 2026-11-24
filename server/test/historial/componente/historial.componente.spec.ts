import type { RegistroGuardado } from '../../../src/modulos/historial/dominio/historial.repository';
import { crearComponenteDePrueba } from '../../compartido/soporte/crear-componente-de-prueba';

function unRegistro(cambios: Partial<RegistroGuardado> = {}): RegistroGuardado {
  return {
    id: 'cancha-1',
    ocurridoEn: new Date('2026-11-20T15:00:00.000Z'),
    importante: false,
    autor: { id: 1, nombre: 'Valeria León' },
    categoria: 'CANCHAS',
    accion: 'ALTA',
    sujeto: 'Cancha 1',
    detalle: null,
    ...cambios,
  };
}

describe('Componente del historial de cambios', () => {
  let componente: Awaited<ReturnType<typeof crearComponenteDePrueba>>;
  let administrador: string;

  beforeEach(async () => {
    componente = await crearComponenteDePrueba();
    administrador = componente.como('ADMINISTRADOR');
    componente.dobles.historial.registros.push(
      unRegistro(),
      unRegistro({ id: 'cancha-2', importante: true, accion: 'DESACTIVACION' }),
    );
  });
  afterEach(() => componente.app.close());

  const consultar = (consulta = '') =>
    componente
      .api()
      .get(`/api/historial${consulta}`)
      .set('Cookie', administrador);

  it.each([
    ['recepción', 'RECEPCIONISTA'],
    ['un jugador', 'JUGADOR'],
  ] as const)('%s no ve el historial', async (_quien, rol) => {
    await componente
      .api()
      .get('/api/historial')
      .set('Cookie', componente.como(rol))
      .expect(403);
  });

  it('es de solo lectura: ningún método escribe', async () => {
    for (const metodo of ['post', 'put', 'patch', 'delete'] as const)
      await componente
        .api()
        [metodo]('/api/historial')
        .set('Cookie', administrador)
        .expect(404);
  });

  it('filtra solo los importantes y dice cuántos hay', async () => {
    const { body } = await consultar('?soloImportantes=true').expect(200);

    expect(body.total).toBe(1);
    expect(body.registros[0].id).toBe('cancha-2');
  });

  it.each([
    ['una página negativa', '?pagina=-1', 'pagina'],
    ['un tamaño de página que no se ofrece', '?porPagina=7', 'porPagina'],
    ['una fecha que no existe', '?desde=2026-02-30', 'desde'],
    ['una categoría inventada', '?categoria=PAGOS', 'categoria'],
    ['un filtro repetido', '?orden=RECIENTES&orden=ANTIGUOS', 'orden'],
    ['un filtro que no existe', '?borrar=todo', 'borrar'],
  ])(
    'rechaza %s y dice qué filtro corregir',
    async (_caso, consulta, campo) => {
      const { body } = await consultar(consulta).expect(400);

      expect(Object.keys(body.errores)).toContain(campo);
    },
  );

  it('con la fecha final antes de la inicial no filtra y explica por qué', async () => {
    const { body } = await consultar(
      '?desde=2026-11-24&hasta=2026-11-20',
    ).expect(400);

    expect(body.errores.hasta).toContain(
      'La fecha final es anterior a la inicial',
    );
  });
});
