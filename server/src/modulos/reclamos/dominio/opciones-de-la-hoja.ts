import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

/** Reclamo: disconformidad con el servicio. Queja: malestar con la atención (DS 011-2011-PCM, art. 3). */
export const TIPOS_DE_HOJA = ['RECLAMO', 'QUEJA'] as const;
export type TipoDeHoja = (typeof TIPOS_DE_HOJA)[number];

export const SERVICIOS = [
  'RESERVA_DE_CANCHA',
  'MATERIAL_ADICIONAL',
  'OTRO',
] as const;
export type Servicio = (typeof SERVICIOS)[number];

/** La respuesta va por escrito, por el medio que elige quien reclama (DS 101-2022-PCM, art. 6). */
export const MEDIOS_DE_RESPUESTA = ['CORREO', 'CARTA'] as const;
export type MedioDeRespuesta = (typeof MEDIOS_DE_RESPUESTA)[number];

export const ESTADOS_DE_HOJA = ['NUEVA', 'EN_ATENCION', 'RESPONDIDA'] as const;
export type EstadoDeHoja = (typeof ESTADOS_DE_HOJA)[number];

/** Clasificación interna que pone administración; no se le pide a quien reclama. */
export const MOTIVOS = [
  'RESERVA_Y_PAGO',
  'CANCELACION_Y_DEVOLUCION',
  'ESTADO_DE_LA_CANCHA',
  'ATENCION_DEL_PERSONAL',
  'MATERIAL_ADICIONAL',
  'WEB_Y_CUENTA',
  'OTRO',
] as const;
export type Motivo = (typeof MOTIVOS)[number];

/** Devuelve la opción si es una de las permitidas; si no, falla con el mensaje dado. */
export function elegir<T extends string>(
  valor: string,
  opciones: readonly T[],
  mensaje: string,
): T {
  const opcion = opciones.find((o) => o === valor);
  if (!opcion) throw new ValorInvalidoError(mensaje);
  return opcion;
}
