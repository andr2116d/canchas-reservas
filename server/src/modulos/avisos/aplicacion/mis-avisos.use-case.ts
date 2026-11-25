import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';
import type { AvisoRepository } from '../dominio/aviso';

const AVISOS_QUE_SE_MUESTRAN = 20;

/** La campana de cada persona: sus avisos más recientes y cuántos no leyó. */
export class MisAvisosUseCase {
  constructor(
    private readonly avisos: AvisoRepository,
    private readonly reloj: Reloj,
  ) {}

  async consultar(usuarioId: number) {
    const [recientes, sinLeer] = await Promise.all([
      this.avisos.recientes(usuarioId, AVISOS_QUE_SE_MUESTRAN),
      this.avisos.sinLeer(usuarioId),
    ]);
    return {
      sinLeer,
      avisos: recientes.map(({ id, tipo, referencia, creadoEn, leidoEn }) => ({
        id,
        tipo,
        referencia,
        creadoEn,
        leido: leidoEn !== null,
      })),
    };
  }

  async marcarLeido(usuarioId: number, avisoId: number): Promise<void> {
    const encontrado = await this.avisos.marcarLeido(
      usuarioId,
      avisoId,
      this.reloj.ahora(),
    );
    if (!encontrado) throw new NoEncontradoError('No encontramos ese aviso.');
  }

  marcarTodosLeidos(usuarioId: number): Promise<void> {
    return this.avisos.marcarTodosLeidos(usuarioId, this.reloj.ahora());
  }
}
