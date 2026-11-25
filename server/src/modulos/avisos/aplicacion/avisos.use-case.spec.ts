import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { EnMemoriaAvisoRepository } from '../../../../test/avisos/dobles/en-memoria-aviso.repository';
import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';
import { AvisarUseCase } from './avisar.use-case';
import { MisAvisosUseCase } from './mis-avisos.use-case';

const ADMINISTRACION = [1, 2];
const JUGADOR = 9;

describe('avisos', () => {
  let avisos: EnMemoriaAvisoRepository;
  let reloj: RelojDePrueba;
  let avisar: AvisarUseCase;
  let mios: MisAvisosUseCase;

  beforeEach(() => {
    avisos = new EnMemoriaAvisoRepository({ ADMINISTRADOR: ADMINISTRACION });
    reloj = new RelojDePrueba();
    avisar = new AvisarUseCase(avisos, reloj);
    mios = new MisAvisosUseCase(avisos, reloj);
  });

  it('un aviso al rol llega a cada cuenta de ese rol', async () => {
    await avisar.alRol('ADMINISTRADOR', 'NUEVO_RECLAMO', '000014-2026');

    for (const persona of ADMINISTRACION) {
      expect(await mios.consultar(persona)).toEqual({
        sinLeer: 1,
        avisos: [
          {
            id: expect.any(Number),
            tipo: 'NUEVO_RECLAMO',
            referencia: '000014-2026',
            creadoEn: reloj.ahora(),
            leido: false,
          },
        ],
      });
    }
  });

  it('muestra los más recientes primero y como máximo 20', async () => {
    for (let i = 1; i <= 22; i++) {
      await avisar.a(
        JUGADOR,
        'RECLAMO_RESPONDIDO',
        `${String(i).padStart(6, '0')}-2026`,
      );
      reloj.avanzarMinutos(1);
    }

    const { avisos: lista, sinLeer } = await mios.consultar(JUGADOR);

    expect(sinLeer).toBe(22);
    expect(lista).toHaveLength(20);
    expect(lista[0].referencia).toBe('000022-2026');
  });

  it('marca uno como leído y después todos', async () => {
    await avisar.a(JUGADOR, 'RECLAMO_RESPONDIDO', '000001-2026');
    await avisar.a(JUGADOR, 'RECLAMO_RESPONDIDO', '000002-2026');
    const [primero] = (await mios.consultar(JUGADOR)).avisos;

    await mios.marcarLeido(JUGADOR, primero.id);
    expect((await mios.consultar(JUGADOR)).sinLeer).toBe(1);

    await mios.marcarTodosLeidos(JUGADOR);
    expect((await mios.consultar(JUGADOR)).sinLeer).toBe(0);
  });

  it('no deja marcar el aviso de otra persona', async () => {
    await avisar.alRol('ADMINISTRADOR', 'NUEVO_RECLAMO', '000001-2026');
    const [deOtra] = (await mios.consultar(1)).avisos;

    await expect(mios.marcarLeido(JUGADOR, deOtra.id)).rejects.toThrow(
      NoEncontradoError,
    );
    expect((await mios.consultar(1)).sinLeer).toBe(1);
  });
});
