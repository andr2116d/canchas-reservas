import {
  type ErroresPorCampo,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { momentoEnLima } from '../../../compartido/dominio/momento-en-lima';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { Bloqueo } from '../dominio/bloqueo.entity';
import type { Rango, Repeticion } from '../dominio/repeticion';

const MS_POR_MINUTO = 60 * 1000;

/** Lo que pide administración: qué canchas, de qué tipo, desde y hasta cuándo en Lima, y por qué. */
export interface DatosParaBloquear {
  canchaIds: number[];
  tipo: string;
  /** Empieza en el minuto actual; entonces no hacen falta la fecha ni la hora de inicio. */
  desdeAhora: boolean;
  desdeFecha?: string;
  desdeHora?: string;
  hastaFecha: string;
  hastaHora: string;
  motivo: string;
  repeticion?: Repeticion;
}

const alMinuto = (momento: Date) =>
  new Date(Math.floor(momento.getTime() / MS_POR_MINUTO) * MS_POR_MINUTO);

function leerMomento(
  fecha: string | undefined,
  hora: string | undefined,
): Date | undefined {
  try {
    return momentoEnLima(fecha ?? '', hora ?? '');
  } catch (error) {
    if (error instanceof ValorInvalidoError) return undefined;
    throw error;
  }
}

function erroresDelBloqueo(
  datos: DatosParaBloquear,
  inicio?: Date,
  fin?: Date,
): ErroresPorCampo {
  try {
    Bloqueo.crear({
      canchaId: 0,
      tipo: datos.tipo,
      motivo: datos.motivo,
      inicio: inicio ?? new Date(0),
      fin: fin ?? new Date(1),
    });
    return {};
  } catch (error) {
    if (error instanceof ReglaInvalidaError) return error.errores;
    throw error;
  }
}

/**
 * Lee el pedido y reúne todos sus errores a la vez. El inicio no puede haber
 * pasado: para lo que ocurre ahora está «desde ahora».
 */
export function leerPedidoDeBloqueo(
  datos: DatosParaBloquear,
  ahora: Date,
): { primero: Rango; canchaIds: number[] } {
  const errores: ErroresPorCampo = {};
  const canchaIds = [...new Set(datos.canchaIds)];
  if (canchaIds.length === 0) errores.canchaIds = 'Elige al menos una cancha.';
  const inicio = datos.desdeAhora
    ? alMinuto(ahora)
    : leerMomento(datos.desdeFecha, datos.desdeHora);
  const fin = leerMomento(datos.hastaFecha, datos.hastaHora);
  if (!inicio) errores.desde = 'Elige la fecha y la hora de inicio.';
  else if (inicio < alMinuto(ahora))
    errores.desde =
      'El inicio ya pasó. Para algo que ocurre ahora, usa «Desde ahora».';
  if (!fin) errores.hasta = 'Elige la fecha y la hora de fin.';
  const todos = { ...erroresDelBloqueo(datos, inicio, fin), ...errores };
  if (Object.keys(todos).length > 0 || !inicio || !fin)
    throw new ReglaInvalidaError(todos);
  return { primero: { inicio, fin }, canchaIds };
}
