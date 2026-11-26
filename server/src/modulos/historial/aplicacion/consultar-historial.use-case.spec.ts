import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { EnMemoriaHistorialRepository } from '../../../../test/historial/dobles/en-memoria-historial.repository';
import type { RegistroGuardado } from '../dominio/historial.repository';
import { ConsultarHistorialUseCase } from './consultar-historial.use-case';

const VALERIA = { id: 7, nombre: 'Valeria León' };
const ROSA = { id: 9, nombre: 'Rosa Díaz' };

function registro(
  id: number,
  ocurridoEn: string,
  cambios: Partial<RegistroGuardado> = {},
): RegistroGuardado {
  return {
    id: `cancha-${id}`,
    ocurridoEn: new Date(ocurridoEn),
    categoria: 'CANCHAS',
    accion: 'ALTA',
    sujeto: `Cancha ${id}`,
    detalle: null,
    importante: false,
    autor: VALERIA,
    ...cambios,
  };
}

describe('ConsultarHistorialUseCase', () => {
  let historial: EnMemoriaHistorialRepository;
  let consultar: ConsultarHistorialUseCase;

  beforeEach(() => {
    historial = new EnMemoriaHistorialRepository();
    consultar = new ConsultarHistorialUseCase(historial);
    historial.registros.push(
      registro(1, '2026-11-20T15:00:00Z'),
      registro(2, '2026-11-22T15:00:00Z', {
        autor: ROSA,
        accion: 'ELIMINACION',
        importante: true,
      }),
      registro(3, '2026-11-24T15:00:00Z'),
    );
  });

  it('devuelve la página pedida, lo más reciente primero, con el total y las páginas', async () => {
    const pagina = await consultar.consultar({ porPagina: '10' });

    expect(pagina).toMatchObject({
      total: 3,
      pagina: 1,
      porPagina: 10,
      paginas: 1,
    });
    expect(pagina.registros.map((r) => r.id)).toEqual([
      'cancha-3',
      'cancha-2',
      'cancha-1',
    ]);
    expect(pagina.registros[0]).toEqual({
      id: 'cancha-3',
      ocurridoEn: '2026-11-24T15:00:00.000Z',
      categoria: 'CANCHAS',
      accion: 'ALTA',
      importante: false,
      autor: VALERIA,
      sujeto: 'Cancha 3',
      detalle: [],
    });
  });

  it('combina filtros: quién, acción e importancia', async () => {
    const pagina = await consultar.consultar({
      autor: '9',
      accion: 'ELIMINACION',
      soloImportantes: 'true',
    });

    expect(pagina.registros.map((r) => r.id)).toEqual(['cancha-2']);
  });

  it('filtra por días de Lima, con el último día incluido', async () => {
    const pagina = await consultar.consultar({
      desde: '2026-11-22',
      hasta: '2026-11-24',
    });

    expect(pagina.registros.map((r) => r.id)).toEqual(['cancha-3', 'cancha-2']);
  });

  it('sin registros que cumplan, devuelve la lista vacía y cero páginas', async () => {
    const pagina = await consultar.consultar({ categoria: 'TARIFAS' });

    expect(pagina).toMatchObject({ registros: [], total: 0, paginas: 0 });
  });

  it('pagina de a pocos y en el orden pedido', async () => {
    const segunda = await consultar.consultar({
      orden: 'ANTIGUOS',
      porPagina: '10',
      pagina: '1',
    });

    expect(segunda.registros.map((r) => r.id)).toEqual([
      'cancha-1',
      'cancha-2',
      'cancha-3',
    ]);
  });

  it('con la fecha final antes de la inicial no consulta y dice por qué', async () => {
    await expect(
      consultar.consultar({ desde: '2026-11-24', hasta: '2026-11-20' }),
    ).rejects.toThrow(ReglaInvalidaError);
  });

  it('lista a quienes tienen registros, para filtrar por persona', async () => {
    historial.personas.push({ ...VALERIA, rol: 'ADMINISTRADOR' });

    expect(await consultar.autores()).toEqual([
      { ...VALERIA, rol: 'ADMINISTRADOR' },
    ]);
  });
});
