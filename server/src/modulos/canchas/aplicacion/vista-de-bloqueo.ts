import type { EtapaDelBloqueo, TipoDeBloqueo } from '../dominio/bloqueo.entity';
import type { BloqueoDeLaCancha } from '../dominio/bloqueo.repository';
import type { ReservaAfectada } from './reservas-de-cancha.port';

/** Un bloqueo como lo ve administración. `fin` es el efectivo: si se liberó, desde cuándo. */
export interface VistaDeBloqueo {
  id: number;
  canchaId: number;
  cancha: string;
  tipo: TipoDeBloqueo;
  motivo: string;
  inicio: string;
  fin: string;
  liberado: boolean;
  etapa: EtapaDelBloqueo;
}

export interface VistaDeReservaAfectada {
  cancha: string;
  inicio: string;
  fin: string;
  titular: string;
}

export function aVistaDeBloqueo(
  { bloqueo, cancha }: BloqueoDeLaCancha,
  ahora: Date,
): VistaDeBloqueo {
  const { canchaId, tipo, motivo, inicio, liberadoEn } = bloqueo.ficha;
  return {
    id: bloqueo.id!,
    canchaId,
    cancha,
    tipo,
    motivo,
    inicio: inicio.toISOString(),
    fin: bloqueo.finEfectivo.toISOString(),
    liberado: liberadoEn !== null,
    etapa: bloqueo.etapa(ahora),
  };
}

export function aVistaDeReservaAfectada(
  reserva: ReservaAfectada,
  cancha: string,
): VistaDeReservaAfectada {
  return {
    cancha,
    inicio: reserva.inicio.toISOString(),
    fin: reserva.fin.toISOString(),
    titular: reserva.titular,
  };
}
