/** De dónde viene cada registro del historial. */
export const CATEGORIAS = [
  'CUENTAS',
  'TARIFAS',
  'HORARIO',
  'CANCELACION',
  'ADELANTO',
  'CANCHAS',
  'MANTENIMIENTO',
  'ADICIONALES',
  'ACCESOS',
  'RECLAMOS',
  'RESERVAS',
  'VENTANA_DE_LLEGADA',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const ACCIONES = [
  'ALTA',
  'EDICION',
  'DESACTIVACION',
  'REACTIVACION',
  'ELIMINACION',
  'RESTABLECIMIENTO_DE_CONTRASENA',
  'CONFIRMACION_DE_DATOS',
  'EDICION_PROPIA',
  'CAMBIO_DE_CONTRASENA',
  'CAMBIO_DE_CORREO',
  'CAMBIO_DE_DOCUMENTO',
  'BLOQUEO',
  'LIBERACION_DE_BLOQUEO',
  'RETIRO_DE_BLOQUEO',
  'INICIO_DE_SESION',
  'APERTURA',
  'CLASIFICACION',
  'CAMBIO_DE_TIPO',
  'RESPUESTA',
  'SEPARACION',
  'CHECK_IN',
] as const;

export type Accion = (typeof ACCIONES)[number];

export const esCategoria = (valor: string): valor is Categoria =>
  (CATEGORIAS as readonly string[]).includes(valor);

export const esAccion = (valor: string): valor is Accion =>
  (ACCIONES as readonly string[]).includes(valor);
