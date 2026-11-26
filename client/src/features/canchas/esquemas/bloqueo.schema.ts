import type { Frecuencia, PedidoDeBloqueo, TipoDeBloqueo } from "../servicios/bloqueos";

const LARGO_MAXIMO_DEL_MOTIVO = 200;

export interface Momento {
  fecha: string;
  hora: string;
}

/** El bloqueo mientras se llena. Una emergencia empieza ahora. */
export interface BorradorDeBloqueo {
  canchaIds: number[];
  tipo: TipoDeBloqueo;
  desde: Momento;
  hasta: Momento;
  motivo: string;
  repite: boolean;
  frecuencia: Frecuencia;
  repiteHasta: string;
}

const momento = ({ fecha, hora }: Momento) => `${fecha}T${hora}`;

/** Revisa el formato antes de enviar; las reglas de fondo (cruces, reservas, fechas pasadas) las revisa el server. */
export function erroresDelBloqueo(borrador: BorradorDeBloqueo): Record<string, string> {
  const errores: Record<string, string> = {};
  if (borrador.canchaIds.length === 0) errores.canchaIds = "Elige al menos una cancha.";
  if (!borrador.motivo.trim()) errores.motivo = "Escribe el motivo del bloqueo.";
  else if (borrador.motivo.trim().length > LARGO_MAXIMO_DEL_MOTIVO) errores.motivo = `Usa como máximo ${LARGO_MAXIMO_DEL_MOTIVO} caracteres.`;
  if (!borrador.hasta.fecha) errores.hasta = "Elige la fecha de fin.";
  else if (borrador.tipo === "PROGRAMADO" && momento(borrador.hasta) <= momento(borrador.desde)) errores.hasta = "El fin debe ser después del inicio.";
  if (borrador.repite && !borrador.repiteHasta) errores.repeticion = "Elige hasta qué fecha se repite.";
  return errores;
}

/** Lo que se envía: una emergencia empieza ahora, sin fecha ni hora de inicio. */
export function aPedido(borrador: BorradorDeBloqueo): PedidoDeBloqueo {
  const desdeAhora = borrador.tipo === "EMERGENCIA";
  return {
    canchaIds: borrador.canchaIds,
    tipo: borrador.tipo,
    desdeAhora,
    desdeFecha: desdeAhora ? undefined : borrador.desde.fecha,
    desdeHora: desdeAhora ? undefined : borrador.desde.hora,
    hastaFecha: borrador.hasta.fecha,
    hastaHora: borrador.hasta.hora,
    motivo: borrador.motivo.trim(),
    ...(borrador.repite && { repeticion: { frecuencia: borrador.frecuencia, hasta: borrador.repiteHasta } }),
  };
}
