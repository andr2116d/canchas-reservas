import type { HojaDeReclamacion } from '../dominio/hoja-de-reclamacion.entity';

/** Lo que se muestra de una hoja: sus datos tal como los escribió la persona. */
export function verHoja(hoja: HojaDeReclamacion) {
  const { servicio, montoReclamado, descripcion } = hoja.servicio;
  return {
    consumidor: hoja.consumidor,
    representante: hoja.representante,
    servicio: {
      servicio,
      montoReclamado: montoReclamado?.enSoles() ?? null,
      descripcion,
    },
    tipo: hoja.tipo,
    detalle: hoja.detalle,
    pedido: hoja.pedido,
    medioDeRespuesta: hoja.medioDeRespuesta,
  };
}

export type VistaDeLaHoja = ReturnType<typeof verHoja>;
