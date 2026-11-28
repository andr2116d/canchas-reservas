import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { PlazoDeCancelacion } from '../../cancelacion/api-cancelacion';
import type {
  AdicionalOfrecido,
  CatalogoDeAdicionales,
} from './catalogo-de-adicionales.port';
import { exigirTitularHabilitado } from './titular-habilitado';
import type { Titulares } from './titulares.port';
import {
  type DependenciasDelTurno,
  turnoParaReservar,
} from './turno-para-reservar';
import type { TurnoDelLocal, TurnoPedido } from './turnos-del-local.port';

/** Todo lo que se ve antes de confirmar: montos, plazos de cancelación y material del local. */
export interface ResumenDeReserva {
  cancha: TurnoDelLocal['cancha'];
  fecha: string;
  desde: string;
  hasta: string;
  inicio: Date;
  precio: string;
  adelanto: string;
  porcentajeDeAdelanto: number;
  minutosDeRetencion: number;
  plazos: PlazoDeCancelacion[];
  adicionales: AdicionalOfrecido[];
}

export interface DependenciasDelResumen extends DependenciasDelTurno {
  catalogo: CatalogoDeAdicionales;
  titulares: Titulares;
  reloj: Reloj;
}

/** El resumen de un turno libre antes de separarlo, con las reglas vigentes. */
export class ResumirReservaUseCase {
  constructor(private readonly de: DependenciasDelResumen) {}

  async ejecutar(
    pedido: TurnoPedido,
    titularId: number,
  ): Promise<ResumenDeReserva> {
    const ahora = this.de.reloj.ahora();
    await exigirTitularHabilitado(this.de.titulares, titularId, ahora);
    const [{ turno, regla, plazo }, adicionales] = await Promise.all([
      turnoParaReservar(this.de, pedido),
      this.de.catalogo.activos(),
    ]);
    return {
      cancha: turno.cancha,
      fecha: turno.fecha,
      desde: turno.desde,
      hasta: turno.hasta,
      inicio: turno.inicio,
      precio: turno.precio,
      adelanto: turno.adelanto.monto,
      porcentajeDeAdelanto: turno.adelanto.porcentaje,
      minutosDeRetencion: plazo.valor,
      plazos: regla.regla.plazosPara(turno.inicio, ahora),
      adicionales,
    };
  }
}
