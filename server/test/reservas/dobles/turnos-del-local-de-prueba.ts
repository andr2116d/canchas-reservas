import type {
  TurnoDelLocal,
  TurnoPedido,
  TurnosDelLocal,
} from '../../../src/modulos/reservas/aplicacion/turnos-del-local.port';

/** Turnos que la prueba arma a mano, buscados por cancha, fecha y hora. */
export class TurnosDelLocalDePrueba implements TurnosDelLocal {
  readonly turnos: TurnoDelLocal[] = [];

  buscar(pedido: TurnoPedido): Promise<TurnoDelLocal | undefined> {
    return Promise.resolve(
      this.turnos.find(
        (turno) =>
          turno.cancha.id === pedido.canchaId &&
          turno.fecha === pedido.fecha &&
          turno.desde === pedido.desde,
      ),
    );
  }
}
