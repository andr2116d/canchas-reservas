/** Acciones sobre una cuenta que quedan en la auditoría: las del administrador y las de cada persona sobre la suya. */
export type AccionAuditada =
  | 'ALTA'
  | 'EDICION'
  | 'DESACTIVACION'
  | 'REACTIVACION'
  | 'RESTABLECIMIENTO_DE_CONTRASENA'
  | 'CONFIRMACION_DE_DATOS'
  | 'EDICION_PROPIA'
  | 'CAMBIO_DE_CONTRASENA'
  | 'CAMBIO_DE_CORREO'
  | 'CAMBIO_DE_DOCUMENTO';
