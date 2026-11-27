import { Injectable } from '@nestjs/common';
import { momentoEnLima } from '../../../../compartido/dominio/momento-en-lima';
import { ConsultarDisponibilidadUseCase } from '../../../disponibilidad/api-disponibilidad';
import type {
  TurnoDelLocal,
  TurnoPedido,
  TurnosDelLocal,
} from '../../aplicacion/turnos-del-local.port';

/** Busca el turno en el mismo mapa que ve el jugador, con sus reglas, precio y estado. */
@Injectable()
export class MapaTurnosDelLocalAdapter implements TurnosDelLocal {
  constructor(private readonly mapaDelDia: ConsultarDisponibilidadUseCase) {}

  async buscar({
    canchaId,
    fecha,
    desde,
  }: TurnoPedido): Promise<TurnoDelLocal | undefined> {
    const mapa = await this.mapaDelDia.ejecutar(fecha);
    for (const tipo of mapa.tipos) {
      const cancha = tipo.canchas.find((c) => c.id === canchaId);
      if (!cancha || tipo.estado !== 'CON_TURNOS') continue;
      const turno = tipo.turnos.find((t) => t.desde === desde);
      if (!turno) return undefined;
      const estado = turno.canchas.find((c) => c.canchaId === canchaId)?.estado;
      return {
        cancha: { ...cancha, tipo: tipo.tipo },
        fecha: mapa.fecha,
        desde: turno.desde,
        hasta: turno.hasta,
        inicio: turno.inicio,
        fin: momentoEnLima(mapa.fecha, turno.hasta),
        precio: turno.precio,
        adelanto:
          turno.adelanto && mapa.adelanto !== null
            ? { monto: turno.adelanto, porcentaje: mapa.adelanto }
            : null,
        libre: estado === 'DISPONIBLE',
      };
    }
    return undefined;
  }
}
