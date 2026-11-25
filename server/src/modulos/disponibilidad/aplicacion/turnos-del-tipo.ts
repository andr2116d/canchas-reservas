import { HoraDelDia } from '../../../compartido/dominio/hora-del-dia.value-object';
import { momentoEnLima } from '../../../compartido/dominio/momento-en-lima';
import { Monto } from '../../../compartido/dominio/monto.value-object';
import type { PorcentajeDeAdelanto } from '../../adelanto/api-adelanto';
import type { TurnoConPrecio } from '../../tarifas/api-tarifas';
import {
  estadoDelTurno,
  type EstadoDelTurno,
  type OcupacionConocida,
} from '../dominio/estado-del-turno';
import type { CanchaConsultada } from './ocupacion-del-dia.port';

export type Franja = 'DIA' | 'NOCHE' | 'MIXTA';

/** Un turno del día con su precio, el adelanto mínimo y cómo está en cada cancha. */
export interface TurnoDelMapa {
  desde: string;
  hasta: string;
  /** El rato final del día, más corto que un turno completo y cobrado en proporción. */
  corto: boolean;
  franja: Franja;
  precio: string;
  /** Falta mientras administración no guarde el adelanto mínimo. */
  adelanto: string | null;
  inicio: Date;
  canchas: { canchaId: number; estado: EstadoDelTurno }[];
}

export interface DatosDelDia {
  fecha: string;
  inicioDeLaNoche: string;
  canchas: CanchaConsultada[];
  porcentaje?: PorcentajeDeAdelanto;
  ocupacion: OcupacionConocida;
}

const minutos = (hora: string) => HoraDelDia.crearHastaMedianoche(hora).minutos;

function franjaDe({ tramos }: TurnoConPrecio): Franja {
  const franjas = new Set(tramos.map((tramo) => tramo.franja));
  return franjas.size > 1 ? 'MIXTA' : [...franjas][0];
}

/** Cada turno del tipo con su precio, su adelanto y su estado en cada cancha del tipo. */
export function turnosDelTipo(
  turnos: TurnoConPrecio[],
  dia: DatosDelDia,
): TurnoDelMapa[] {
  const noche = minutos(dia.inicioDeLaNoche);
  return turnos.map((turno) => {
    const inicio = momentoEnLima(dia.fecha, turno.desde);
    const fin = momentoEnLima(dia.fecha, turno.hasta);
    const llegaALaNoche = minutos(turno.hasta) > noche;
    return {
      desde: turno.desde,
      hasta: turno.hasta,
      corto: turno.corto,
      franja: franjaDe(turno),
      precio: turno.total,
      adelanto:
        dia.porcentaje?.adelantoDe(Monto.crear(turno.total)).enSoles() ?? null,
      inicio,
      canchas: dia.canchas.map((cancha) => ({
        canchaId: cancha.id,
        estado: estadoDelTurno(
          {
            canchaId: cancha.id,
            inicio,
            fin,
            necesitaLuzSinTenerla: llegaALaNoche && !cancha.tieneIluminacion,
          },
          dia.ocupacion,
        ),
      })),
    };
  });
}
