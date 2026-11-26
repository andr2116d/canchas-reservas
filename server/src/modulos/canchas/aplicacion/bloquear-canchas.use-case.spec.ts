import {
  ConflictoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { EnMemoriaBloqueoRepository } from '../../../../test/canchas/dobles/en-memoria-bloqueo.repository';
import { EnMemoriaCanchaRepository } from '../../../../test/canchas/dobles/en-memoria-cancha.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { ReservasDeCanchaDePrueba } from '../../../../test/canchas/dobles/reservas-de-cancha-de-prueba';
import { unBloqueoValido } from '../../../../test/canchas/fabricas/datos-bloqueo';
import { unaCanchaValida } from '../../../../test/canchas/fabricas/datos-cancha';
import { Cancha } from '../dominio/cancha.entity';
import { BloquearCanchasUseCase } from './bloquear-canchas.use-case';

const ADMINISTRADOR = 7;
// Martes 24 de noviembre de 2026, 10:30 en Lima.
const AHORA = new Date('2026-11-24T10:30:00.000-05:00');

describe('BloquearCanchasUseCase', () => {
  let canchas: EnMemoriaCanchaRepository;
  let bloqueos: EnMemoriaBloqueoRepository;
  let reservas: ReservasDeCanchaDePrueba;
  let bloquear: BloquearCanchasUseCase;

  beforeEach(async () => {
    canchas = new EnMemoriaCanchaRepository();
    bloqueos = new EnMemoriaBloqueoRepository({
      1: 'Cancha 1',
      2: 'Cancha 2',
      3: 'Cancha 3',
    });
    reservas = new ReservasDeCanchaDePrueba();
    bloquear = new BloquearCanchasUseCase({
      canchas,
      bloqueos,
      reservas,
      reloj: new RelojDePrueba(AHORA),
    });
    await canchas.registrar(
      ['Cancha 1', 'Cancha 2', 'Cancha 3'].map((nombre) =>
        Cancha.crear(unaCanchaValida({ nombre })),
      ),
      { ejecutadoPorId: ADMINISTRADOR, ocurridoEn: AHORA },
    );
  });

  const fallo = (datos = unBloqueoValido()) =>
    bloquear.ejecutar(datos, ADMINISTRADOR).catch((error: unknown) => error);

  it('crea un bloqueo por cancha, todos con el mismo rango de Lima, y los audita', async () => {
    const { bloqueos: creados } = await bloquear.ejecutar(
      unBloqueoValido({ canchaIds: [1, 2] }),
      ADMINISTRADOR,
    );

    expect(creados.map((b) => [b.cancha, b.inicio, b.fin, b.etapa])).toEqual([
      [
        'Cancha 1',
        '2026-11-28T13:00:00.000Z',
        '2026-11-28T19:00:00.000Z',
        'PROXIMO',
      ],
      [
        'Cancha 2',
        '2026-11-28T13:00:00.000Z',
        '2026-11-28T19:00:00.000Z',
        'PROXIMO',
      ],
    ]);
    expect(
      bloqueos.auditoria.map((a) => [a.accion, a.canchaId, a.ejecutadoPorId]),
    ).toEqual([
      ['BLOQUEO', 1, ADMINISTRADOR],
      ['BLOQUEO', 2, ADMINISTRADOR],
    ]);
  });

  it('con repetición crea un bloqueo por vez y por cancha', async () => {
    const { bloqueos: creados } = await bloquear.ejecutar(
      unBloqueoValido({
        canchaIds: [1, 2],
        repeticion: { frecuencia: 'SEMANAL', hasta: '2026-12-12' },
      }),
      ADMINISTRADOR,
    );

    expect(creados).toHaveLength(6);
  });

  it('informa a la vez lo que falta: canchas, motivo y un fin posterior al inicio', async () => {
    const error = await fallo(
      unBloqueoValido({ canchaIds: [], motivo: '', hastaHora: '07:00' }),
    );

    expect(error).toBeInstanceOf(ReglaInvalidaError);
    expect((error as ReglaInvalidaError).errores).toEqual({
      canchaIds: 'Elige al menos una cancha.',
      motivo: 'Escribe el motivo del bloqueo.',
      hasta: 'El fin debe ser después del inicio.',
    });
  });

  it('no acepta un inicio que ya pasó; «desde ahora» empieza en este minuto', async () => {
    const pasado = await fallo(
      unBloqueoValido({ desdeFecha: '2026-11-24', desdeHora: '09:00' }),
    );
    expect((pasado as ReglaInvalidaError).errores).toEqual({
      desde:
        'El inicio ya pasó. Para algo que ocurre ahora, usa «Desde ahora».',
    });

    const { bloqueos: creados } = await bloquear.ejecutar(
      unBloqueoValido({
        tipo: 'EMERGENCIA',
        desdeAhora: true,
        desdeFecha: undefined,
        desdeHora: undefined,
      }),
      ADMINISTRADOR,
    );
    expect(creados[0]).toMatchObject({
      inicio: AHORA.toISOString(),
      etapa: 'EN_CURSO',
    });
  });

  it('no bloquea una cancha desactivada', async () => {
    const cancha = (await canchas.buscar(3))!;
    cancha.desactivar();
    await canchas.guardar(cancha, {
      accion: 'DESACTIVACION',
      ejecutadoPorId: 1,
      ocurridoEn: AHORA,
    });

    const error = await fallo(unBloqueoValido({ canchaIds: [1, 3] }));

    expect((error as ReglaInvalidaError).errores).toEqual({
      canchaIds: 'Cancha 3 está desactivada: ya no se puede reservar.',
    });
  });

  it('no pisa otro bloqueo de la misma cancha y dice cuál es', async () => {
    await bloquear.ejecutar(unBloqueoValido(), ADMINISTRADOR);

    const error = await fallo(
      unBloqueoValido({ desdeHora: '13:00', hastaHora: '16:00' }),
    );

    expect(error).toEqual(
      new ConflictoError('Ya hay un bloqueo en ese rango.', {}),
    );
    expect((error as ConflictoError).datos).toEqual({
      bloqueos: [
        expect.objectContaining({
          cancha: 'Cancha 1',
          inicio: '2026-11-28T13:00:00.000Z',
        }),
      ],
    });
  });

  it('uno programado que choca con reservas no se guarda y lista las reservas', async () => {
    reservas.reservar(2, '2026-11-28T10:00:00.000-05:00', 'M. Quispe');

    const error = await fallo(unBloqueoValido({ canchaIds: [1, 2] }));

    expect(error).toBeInstanceOf(ConflictoError);
    expect((error as ConflictoError).datos).toEqual({
      reservas: [
        {
          cancha: 'Cancha 2',
          inicio: '2026-11-28T15:00:00.000Z',
          fin: '2026-11-28T16:00:00.000Z',
          titular: 'M. Quispe',
        },
      ],
    });
    expect(await bloqueos.sinTerminar(AHORA)).toHaveLength(0);
  });

  it('uno de emergencia se guarda aunque choque y devuelve las reservas afectadas', async () => {
    reservas.reservar(1, '2026-11-24T11:00:00.000-05:00');

    const resultado = await bloquear.ejecutar(
      unBloqueoValido({
        tipo: 'EMERGENCIA',
        desdeAhora: true,
        hastaFecha: '2026-11-24',
        hastaHora: '18:00',
      }),
      ADMINISTRADOR,
    );

    expect(resultado.bloqueos).toHaveLength(1);
    expect(resultado.reservasAfectadas).toEqual([
      expect.objectContaining({ cancha: 'Cancha 1', titular: 'R. Castillo' }),
    ]);
  });
});
