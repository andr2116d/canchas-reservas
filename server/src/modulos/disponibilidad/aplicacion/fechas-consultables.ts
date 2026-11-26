import {
  fechaEnLima,
  leerFecha,
  sumarAFecha,
} from '../../../compartido/dominio/momento-en-lima';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

/** Cuántos días hacia adelante se pueden consultar, además de hoy. */
export const DIAS_CONSULTABLES = 30;

export interface FechasConsultables {
  hoy: string;
  ultimaFecha: string;
}

export function fechasConsultables(ahora: Date): FechasConsultables {
  const hoy = fechaEnLima(ahora);
  return { hoy, ultimaFecha: sumarAFecha(hoy, { dias: DIAS_CONSULTABLES }) };
}

function leerFechaConsultable(
  texto: string,
  { hoy, ultimaFecha }: FechasConsultables,
): string {
  const fecha = leerFecha(texto);
  if (fecha < hoy) throw new ValorInvalidoError('Elige una fecha desde hoy.');
  if (fecha > ultimaFecha) {
    throw new ValorInvalidoError(
      'Solo se pueden consultar los próximos 30 días.',
    );
  }
  return fecha;
}

/** La fecha pedida (o hoy, si no se pide ninguna), desde hoy y hasta 30 días después. */
export function exigirFechaConsultable(
  texto: string | undefined,
  rango: FechasConsultables,
): string {
  if (texto === undefined) return rango.hoy;
  return validarCampos({ fecha: () => leerFechaConsultable(texto, rango) })
    .fecha;
}
