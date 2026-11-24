import { EnMemoriaBloqueoRepository } from '../../../../test/dobles/en-memoria-bloqueo.repository';
import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { Bloqueo } from '../dominio/bloqueo.entity';
import { ConsultarBloqueosUseCase } from './consultar-bloqueos.use-case';
import { LiberarBloqueoUseCase } from './liberar-bloqueo.use-case';
import { QuitarBloqueoUseCase } from './quitar-bloqueo.use-case';

const ADMINISTRADOR = 7;
const enLima = (texto: string) => new Date(`2026-11-24T${texto}:00.000-05:00`);

describe('Estado de un bloqueo', () => {
  let bloqueos: EnMemoriaBloqueoRepository;
  let reloj: RelojDePrueba;

  beforeEach(async () => {
    bloqueos = new EnMemoriaBloqueoRepository({ 1: 'Cancha 1' });
    reloj = new RelojDePrueba(enLima('10:30'));
    const rango = (inicio: string, fin: string) =>
      Bloqueo.crear({
        canchaId: 1,
        tipo: 'PROGRAMADO',
        inicio: enLima(inicio),
        fin: enLima(fin),
        motivo: 'Fumigación.',
      });
    await bloqueos.registrar(
      [
        rango('08:00', '14:00'),
        rango('16:00', '18:00'),
        rango('06:00', '07:00'),
      ],
      {
        ejecutadoPorId: ADMINISTRADOR,
        ocurridoEn: enLima('05:00'),
      },
    );
    bloqueos.auditoria.length = 0;
  });

  it('libera desde ahora uno en curso: la cancha vuelve a estar disponible y queda auditado', async () => {
    await new LiberarBloqueoUseCase(bloqueos, reloj).ejecutar(1, ADMINISTRADOR);

    const { bloqueo } = (await bloqueos.buscar(1))!;
    expect(bloqueo.finEfectivo).toEqual(enLima('10:30'));
    expect(bloqueos.auditoria).toEqual([
      expect.objectContaining({
        accion: 'LIBERACION_DE_BLOQUEO',
        ejecutadoPorId: ADMINISTRADOR,
      }),
    ]);
  });

  it('quita entero uno que no empezó; uno en curso o pasado no se quita', async () => {
    const quitar = new QuitarBloqueoUseCase(bloqueos, reloj);

    await quitar.ejecutar(2, ADMINISTRADOR);

    expect(await bloqueos.buscar(2)).toBeUndefined();
    await expect(quitar.ejecutar(1, ADMINISTRADOR)).rejects.toThrow(
      'El bloqueo ya empezó: libéralo desde ahora.',
    );
    await expect(quitar.ejecutar(3, ADMINISTRADOR)).rejects.toThrow(
      'El bloqueo ya terminó.',
    );
  });

  it('responde que no existe a un id desconocido', async () => {
    await expect(
      new LiberarBloqueoUseCase(bloqueos, reloj).ejecutar(99, ADMINISTRADOR),
    ).rejects.toThrow('No encontramos el bloqueo.');
  });

  it('lista los en curso y próximos, y aparte los terminados', async () => {
    const lista = await new ConsultarBloqueosUseCase(
      bloqueos,
      reloj,
    ).ejecutar();

    expect(lista.sinTerminar.map((b) => [b.id, b.etapa])).toEqual([
      [1, 'EN_CURSO'],
      [2, 'PROXIMO'],
    ]);
    expect(lista.terminados.map((b) => b.id)).toEqual([3]);
    expect(lista.sinTerminar[0]).toEqual({
      id: 1,
      canchaId: 1,
      cancha: 'Cancha 1',
      tipo: 'PROGRAMADO',
      motivo: 'Fumigación.',
      inicio: '2026-11-24T13:00:00.000Z',
      fin: '2026-11-24T19:00:00.000Z',
      liberado: false,
      etapa: 'EN_CURSO',
    });
  });
});
