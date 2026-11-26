import type { HojaDeReclamacion } from '../dominio/hoja-de-reclamacion.entity';
import { diasHabilesRestantes } from '../dominio/plazo-de-respuesta';

const LARGO_DEL_RESUMEN = 140;

function numeroDe(hoja: HojaDeReclamacion): string {
  if (!hoja.numero) throw new Error('La hoja aún no tiene número.');
  return hoja.numero.texto;
}

/** El plazo que queda en días hábiles; ya no corre cuando la hoja está respondida. */
function plazoDe(hoja: HojaDeReclamacion, hoy: string) {
  return {
    fechaLimite: hoja.fechaLimite,
    diasHabilesRestantes:
      hoja.estado === 'RESPONDIDA'
        ? null
        : diasHabilesRestantes(hoy, hoja.fechaLimite),
  };
}

/**
 * Lo que ve quien sigue su hoja con el número y el código: estado, plazo y lo reclamado.
 * No lleva sus datos personales; los tiene en su constancia.
 */
export function verSeguimiento(hoja: HojaDeReclamacion, hoy: string) {
  const { servicio, montoReclamado, descripcion } = hoja.servicio;
  return {
    numero: numeroDe(hoja),
    tipo: hoja.tipo,
    estado: hoja.estado,
    registradaEn: hoja.registradaEn,
    ...plazoDe(hoja, hoy),
    medioDeRespuesta: hoja.medioDeRespuesta,
    servicio: {
      servicio,
      montoReclamado: montoReclamado?.enSoles() ?? null,
      descripcion,
    },
    detalle: hoja.detalle,
    pedido: hoja.pedido,
    abiertaEn: hoja.abiertaEn,
    respuesta: hoja.respuesta,
  };
}

/** Una fila de «Mis reclamos»: lo justo para reconocer la hoja y su estado. */
export function verResumen(hoja: HojaDeReclamacion, hoy: string) {
  const resumen =
    hoja.detalle.length > LARGO_DEL_RESUMEN
      ? `${hoja.detalle.slice(0, LARGO_DEL_RESUMEN)}…`
      : hoja.detalle;
  return {
    numero: numeroDe(hoja),
    tipo: hoja.tipo,
    estado: hoja.estado,
    registradaEn: hoja.registradaEn,
    ...plazoDe(hoja, hoy),
    resumen,
  };
}

export type VistaDeSeguimiento = ReturnType<typeof verSeguimiento>;
export type ResumenDeHoja = ReturnType<typeof verResumen>;
