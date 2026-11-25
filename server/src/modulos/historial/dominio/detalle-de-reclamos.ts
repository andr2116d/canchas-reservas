import type { LineaDeDetalle } from './linea-de-detalle';

const NOMBRE_DEL_MOTIVO: Record<string, string> = {
  RESERVA_Y_PAGO: 'Reserva y pago',
  CANCELACION_Y_DEVOLUCION: 'Cancelación y devolución',
  ESTADO_DE_LA_CANCHA: 'Estado de la cancha',
  ATENCION_DEL_PERSONAL: 'Atención del personal',
  MATERIAL_ADICIONAL: 'Material adicional',
  WEB_Y_CUENTA: 'Web y cuenta',
  OTRO: 'Otro',
};

const NOMBRE_DEL_TIPO: Record<string, string> = {
  RECLAMO: 'Reclamo',
  QUEJA: 'Queja',
};
const NOMBRE_DEL_MEDIO: Record<string, string> = {
  CORREO: 'Correo',
  CARTA: 'Carta',
};

const nombre = (nombres: Record<string, string>, clave: unknown) =>
  typeof clave === 'string' ? (nombres[clave] ?? clave) : null;

/** El detalle de la atención de una hoja: motivo, tipo o cómo se respondió. */
export function detalleDeReclamo(
  accion: string,
  detalle: Record<string, unknown>,
): LineaDeDetalle[] {
  switch (accion) {
    case 'CLASIFICACION':
      return [
        {
          campo: 'Motivo',
          antes: nombre(NOMBRE_DEL_MOTIVO, detalle.antes),
          despues: nombre(NOMBRE_DEL_MOTIVO, detalle.despues),
        },
      ];
    case 'CAMBIO_DE_TIPO':
      return [
        {
          campo: 'Tipo',
          antes: nombre(NOMBRE_DEL_TIPO, detalle.antes),
          despues: nombre(NOMBRE_DEL_TIPO, detalle.despues),
        },
      ];
    case 'RESPUESTA':
      return [
        {
          campo: 'Medio',
          antes: null,
          despues: nombre(NOMBRE_DEL_MEDIO, detalle.medio),
        },
        {
          campo: 'Plazo',
          antes: null,
          despues: detalle.fueraDePlazo ? 'Fuera de plazo' : 'Dentro del plazo',
        },
      ];
    default:
      return [];
  }
}
