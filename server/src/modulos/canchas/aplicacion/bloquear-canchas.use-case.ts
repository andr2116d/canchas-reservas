import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import {
  ConflictoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { Bloqueo } from '../dominio/bloqueo.entity';
import type { BloqueoRepository } from '../dominio/bloqueo.repository';
import type { CanchaRepository } from '../dominio/cancha.repository';
import { type Rango, rangosDelBloqueo } from '../dominio/repeticion';
import {
  type DatosParaBloquear,
  leerPedidoDeBloqueo,
} from './leer-pedido-de-bloqueo';
import type { ReservasDeCancha } from './reservas-de-cancha.port';
import {
  aVistaDeBloqueo,
  aVistaDeReservaAfectada,
  type VistaDeBloqueo,
  type VistaDeReservaAfectada,
} from './vista-de-bloqueo';

export type { DatosParaBloquear };

const MAXIMO_DE_BLOQUEOS_POR_PEDIDO = 500;

export interface DependenciasDelBloqueo {
  canchas: Pick<CanchaRepository, 'listar'>;
  bloqueos: Pick<BloqueoRepository, 'chocan' | 'registrar'>;
  reservas: Pick<ReservasDeCancha, 'enRangos'>;
  reloj: Reloj;
}

export interface ResultadoDelBloqueo {
  bloqueos: VistaDeBloqueo[];
  /** Solo en una emergencia: reservas que quedan afectadas y que el jugador debe resolver. */
  reservasAfectadas: VistaDeReservaAfectada[];
}

/**
 * Bloquea una o varias canchas operativas por mantenimiento, una vez o con
 * repetición: se guardan todos los bloqueos o ninguno. Uno programado no se
 * guarda si choca con reservas; uno de emergencia sí, y devuelve las afectadas.
 */
export class BloquearCanchasUseCase {
  constructor(private readonly dependencias: DependenciasDelBloqueo) {}

  async ejecutar(
    datos: DatosParaBloquear,
    administradorId: number,
  ): Promise<ResultadoDelBloqueo> {
    const ahora = this.dependencias.reloj.ahora();
    const { primero, canchaIds } = leerPedidoDeBloqueo(datos, ahora);
    const rangos = rangosDelBloqueo(primero, datos.repeticion);
    if (rangos.length * canchaIds.length > MAXIMO_DE_BLOQUEOS_POR_PEDIDO)
      throw new ReglaInvalidaError({
        repeticion: `Son demasiados bloqueos a la vez: como máximo ${MAXIMO_DE_BLOQUEOS_POR_PEDIDO}.`,
      });
    const nombres = await this.canchasOperativas(canchaIds);
    await this.exigirSinCruces(canchaIds, rangos, ahora);
    const afectadas = await this.reservasAfectadas(canchaIds, rangos, nombres);
    if (afectadas.length > 0 && datos.tipo === 'PROGRAMADO')
      throw new ConflictoError(
        'Choca con reservas: reubícalas o cancélalas antes, o elige otras horas.',
        {},
        { reservas: afectadas },
      );
    const nuevos = canchaIds.flatMap((canchaId) =>
      rangos.map(({ inicio, fin }) =>
        Bloqueo.crear({
          canchaId,
          tipo: datos.tipo,
          motivo: datos.motivo,
          inicio,
          fin,
        }),
      ),
    );
    const guardados = await this.dependencias.bloqueos.registrar(nuevos, {
      ejecutadoPorId: administradorId,
      ocurridoEn: ahora,
    });
    return {
      bloqueos: guardados.map((bloqueo) =>
        aVistaDeBloqueo(
          { bloqueo, cancha: nombres.get(bloqueo.ficha.canchaId)! },
          ahora,
        ),
      ),
      reservasAfectadas: afectadas,
    };
  }

  private async canchasOperativas(ids: number[]): Promise<Map<number, string>> {
    const porId = new Map(
      (await this.dependencias.canchas.listar()).map((c) => [c.id!, c.ficha]),
    );
    for (const id of ids) {
      const ficha = porId.get(id);
      if (!ficha)
        throw new ReglaInvalidaError({
          canchaIds: 'Elige canchas de la lista.',
        });
      if (ficha.estado === 'DESACTIVADA')
        throw new ReglaInvalidaError({
          canchaIds: `${ficha.nombre} está desactivada: ya no se puede reservar.`,
        });
    }
    return new Map(ids.map((id) => [id, porId.get(id)!.nombre]));
  }

  private async exigirSinCruces(
    canchaIds: number[],
    rangos: Rango[],
    ahora: Date,
  ): Promise<void> {
    const cruces = await this.dependencias.bloqueos.chocan(canchaIds, rangos);
    if (cruces.length > 0)
      throw new ConflictoError(
        'Ya hay un bloqueo en ese rango.',
        {},
        { bloqueos: cruces.map((c) => aVistaDeBloqueo(c, ahora)) },
      );
  }

  private async reservasAfectadas(
    canchaIds: number[],
    rangos: Rango[],
    nombres: Map<number, string>,
  ): Promise<VistaDeReservaAfectada[]> {
    const consultas = canchaIds.flatMap((canchaId) =>
      rangos.map(({ inicio, fin }) => ({ canchaId, inicio, fin })),
    );
    const reservas = await this.dependencias.reservas.enRangos(consultas);
    return reservas
      .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
      .map((reserva) =>
        aVistaDeReservaAfectada(reserva, nombres.get(reserva.canchaId)!),
      );
  }
}
