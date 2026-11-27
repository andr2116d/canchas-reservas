import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { momentoEnLima } from '../../../compartido/dominio/momento-en-lima';
import {
  TIPOS_DE_CANCHA,
  type TipoDeCancha,
} from '../../../compartido/dominio/tipo-de-cancha';
import type { AdelantoRepository } from '../../adelanto/api-adelanto';
import {
  diaDeLaSemanaDe,
  type HorarioRepository,
  type HorarioSemanal,
} from '../../horario/api-horario';
import {
  type TarifaRepository,
  turnosConPrecio,
} from '../../tarifas/api-tarifas';
import type { OcupacionConocida } from '../dominio/estado-del-turno';
import {
  exigirFechaConsultable,
  fechasConsultables,
} from './fechas-consultables';
import type {
  CanchaConsultada,
  OcupacionDelDia,
} from './ocupacion-del-dia.port';
import {
  type DatosDelDia,
  turnosDelTipo,
  type TurnoDelMapa,
} from './turnos-del-tipo';

export interface CanchaDelMapa {
  id: number;
  nombre: string;
  tieneIluminacion: boolean;
}

/** Las canchas activas de un tipo y sus turnos; sin tarifa, el tipo no tiene turnos que ofrecer. */
export type TipoDelMapa = { tipo: TipoDeCancha; canchas: CanchaDelMapa[] } & (
  | { estado: 'SIN_TARIFA' }
  | {
      estado: 'CON_TURNOS';
      duracionDelTurnoHoras: number;
      inicioDeLaNoche: string;
      turnos: TurnoDelMapa[];
    }
);

export interface MapaDelDia {
  fecha: string;
  hoy: string;
  /** El último día que se puede consultar. */
  ultimaFecha: string;
  /** La hora del server: con ella el navegador mide cuánto falta para `proximoCambio`. */
  ahora: Date;
  /** Porcentaje del adelanto mínimo; falta si administración no lo guardó. */
  adelanto: number | null;
  local: 'ABIERTO' | 'CERRADO' | 'SIN_HORARIO';
  tipos: TipoDelMapa[];
  /** Cuándo cambia algo solo por la hora (empieza un turno, empieza o termina un bloqueo, vence una reserva). */
  proximoCambio: Date | null;
}

export interface DependenciasDeLaConsulta {
  tarifas: Pick<TarifaRepository, 'vigente'>;
  horarios: Pick<HorarioRepository, 'vigente'>;
  adelantos: Pick<AdelantoRepository, 'vigente'>;
  ocupacion: OcupacionDelDia;
  reloj: Reloj;
}

const sinTipo = ({ id, nombre, tieneIluminacion }: CanchaConsultada) => ({
  id,
  nombre,
  tieneIluminacion,
});

function proximoCambio(
  tipos: TipoDelMapa[],
  { bloqueos, reservas, ahora }: OcupacionConocida,
): Date | null {
  const momentos = [
    ...reservas.flatMap((reserva) =>
      reserva.venceEn ? [reserva.venceEn] : [],
    ),
    ...tipos.flatMap((t) =>
      t.estado === 'CON_TURNOS' ? t.turnos.map((turno) => turno.inicio) : [],
    ),
    ...bloqueos.flatMap((bloqueo) => [bloqueo.inicio, bloqueo.fin]),
  ].filter((momento) => momento > ahora);
  if (momentos.length === 0) return null;
  return new Date(Math.min(...momentos.map((momento) => momento.getTime())));
}

/**
 * Mapa de turnos de un día para cualquiera, sin sesión: cada cancha operativa con
 * sus turnos, su precio, el adelanto mínimo y si se puede elegir. Desde hoy y hasta 30 días.
 */
export class ConsultarDisponibilidadUseCase {
  constructor(private readonly de: DependenciasDeLaConsulta) {}

  async ejecutar(fechaPedida: string | undefined): Promise<MapaDelDia> {
    const ahora = this.de.reloj.ahora();
    const rango = fechasConsultables(ahora);
    const fecha = exigirFechaConsultable(fechaPedida, rango);
    const [horario, adelanto, canchas] = await Promise.all([
      this.de.horarios.vigente(),
      this.de.adelantos.vigente(),
      this.de.ocupacion.canchasOperativas(),
    ]);
    const base = {
      fecha,
      ...rango,
      ahora,
      adelanto: adelanto?.porcentaje.valor ?? null,
      tipos: [],
      proximoCambio: null,
    };
    if (!horario) return { ...base, local: 'SIN_HORARIO' };
    if (!horario.horario.del(diaDeLaSemanaDe(fecha)))
      return { ...base, local: 'CERRADO' };
    const ocupacion = {
      ...(await this.de.ocupacion.entre(
        momentoEnLima(fecha, '00:00'),
        momentoEnLima(fecha, '24:00'),
      )),
      ahora,
    };
    const dia = { fecha, porcentaje: adelanto?.porcentaje, ocupacion };
    const tipos = await this.tiposDelDia(horario.horario, canchas, dia);
    return {
      ...base,
      local: 'ABIERTO',
      tipos,
      proximoCambio: proximoCambio(tipos, ocupacion),
    };
  }

  private async tiposDelDia(
    horario: HorarioSemanal,
    canchas: CanchaConsultada[],
    dia: Omit<DatosDelDia, 'canchas' | 'inicioDeLaNoche'>,
  ): Promise<TipoDelMapa[]> {
    const conCanchas = TIPOS_DE_CANCHA.filter((tipo) =>
      canchas.some((cancha) => cancha.tipo === tipo),
    );
    return Promise.all(
      conCanchas.map(async (tipo): Promise<TipoDelMapa> => {
        const delTipo = canchas.filter((cancha) => cancha.tipo === tipo);
        const tarifa = (await this.de.tarifas.vigente(tipo))?.tarifa;
        const vista = delTipo.map(sinTipo);
        if (!tarifa) return { tipo, canchas: vista, estado: 'SIN_TARIFA' };
        const deUnDia = turnosConPrecio(
          horario,
          diaDeLaSemanaDe(dia.fecha),
          tarifa,
        );
        // El día ya se comprobó abierto antes de llegar aquí.
        if (deUnDia.estado === 'CERRADO') throw new Error('Día cerrado.');
        return {
          tipo,
          canchas: vista,
          estado: 'CON_TURNOS',
          duracionDelTurnoHoras: deUnDia.duracionDelTurnoHoras,
          inicioDeLaNoche: deUnDia.inicioDeLaNoche,
          turnos: turnosDelTipo(deUnDia.turnos, {
            ...dia,
            canchas: delTipo,
            inicioDeLaNoche: deUnDia.inicioDeLaNoche,
          }),
        };
      }),
    );
  }
}
