import type { Accion, Categoria } from './categorias-del-historial';
import {
  detalleDeLaRegla,
  detalleDelAdelanto,
  detalleDelHorario,
  detalleDeTarifa,
  detalleDeVentana,
  type RangoDeLaRegla,
  type VersionDeTarifa,
  type VersionDeVentana,
  type VersionDelAdelanto,
  type VersionDelHorario,
  type Versiones,
} from './detalle-de-configuracion';
import {
  detalleDeAdicional,
  detalleDeBloqueo,
  detalleDeCancha,
} from './detalle-del-catalogo';
import { detalleDeReclamo } from './detalle-de-reclamos';
import { detalleDeReserva, detalleDelCheckIn } from './detalle-de-reservas';
import { type LineaDeDetalle, tamanoLegible } from './linea-de-detalle';

/** Lo que trae cada registro antes de escribirlo para leerse. */
export interface RegistroSinDescribir {
  categoria: Categoria;
  accion: Accion;
  /** Nombre de lo afectado, o su clave (como `FUTBOL_7`) si es un tipo. */
  sujeto: string | null;
  detalle: unknown;
}

const SUJETO_FIJO: Partial<Record<Categoria, string>> = {
  HORARIO: 'Horario de atención',
  CANCELACION: 'Regla de cancelación',
  ADELANTO: 'Adelanto mínimo',
  VENTANA_DE_LLEGADA: 'Ventana de llegada',
};

function sujetoLegible({
  categoria,
  sujeto,
}: RegistroSinDescribir): string | null {
  if (categoria === 'TARIFAS') return sujeto && tamanoLegible(sujeto);
  return SUJETO_FIJO[categoria] ?? sujeto;
}

function lineas({
  categoria,
  accion,
  detalle,
}: RegistroSinDescribir): LineaDeDetalle[] {
  if (detalle === null || detalle === undefined) return [];
  switch (categoria) {
    case 'TARIFAS':
      return detalleDeTarifa(detalle as Versiones<VersionDeTarifa>);
    case 'HORARIO':
      return detalleDelHorario(detalle as Versiones<VersionDelHorario>);
    case 'CANCELACION':
      return detalleDeLaRegla(detalle as Versiones<RangoDeLaRegla[]>);
    case 'ADELANTO':
      return detalleDelAdelanto(detalle as Versiones<VersionDelAdelanto>);
    case 'VENTANA_DE_LLEGADA':
      return detalleDeVentana(detalle as Versiones<VersionDeVentana>);
    case 'CANCHAS':
      return accion === 'EDICION'
        ? detalleDeCancha(detalle as Parameters<typeof detalleDeCancha>[0])
        : [];
    case 'MANTENIMIENTO':
      return detalleDeBloqueo(
        detalle as Parameters<typeof detalleDeBloqueo>[0],
      );
    case 'ADICIONALES':
      return detalleDeAdicional(accion, detalle as Record<string, unknown>);
    case 'RECLAMOS':
      return detalleDeReclamo(accion, detalle as Record<string, unknown>);
    case 'RESERVAS':
      return accion === 'CHECK_IN'
        ? detalleDelCheckIn(detalle as Record<string, unknown>)
        : detalleDeReserva(detalle as Record<string, unknown>);
    default:
      return [];
  }
}

/** Escribe el sujeto y el detalle de un registro para que se lean sin conocer cómo se guardaron. */
export function describirRegistro(registro: RegistroSinDescribir): {
  sujeto: string | null;
  detalle: LineaDeDetalle[];
} {
  return { sujeto: sujetoLegible(registro), detalle: lineas(registro) };
}
