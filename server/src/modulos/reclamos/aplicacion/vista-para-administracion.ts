import type { HojaDeReclamacion } from '../dominio/hoja-de-reclamacion.entity';
import type { CambioRegistrado } from '../dominio/hoja.repository';
import { diasHabilesRestantes } from '../dominio/plazo-de-respuesta';
import { verHoja } from './vista-de-la-hoja';

const LARGO_DEL_RESUMEN = 140;

function estadoYPlazo(hoja: HojaDeReclamacion, hoy: string) {
  const respondida = hoja.estado === 'RESPONDIDA';
  return {
    numero: hoja.numero!.texto,
    tipo: hoja.tipo,
    tipoMarcado: hoja.tipoMarcado,
    motivo: hoja.motivo,
    estado: hoja.estado,
    medioDeRespuesta: hoja.medioDeRespuesta,
    registradaEn: hoja.registradaEn,
    fechaLimite: hoja.fechaLimite,
    diasHabilesRestantes: respondida
      ? null
      : diasHabilesRestantes(hoy, hoja.fechaLimite),
    vencida: !respondida && hoy > hoja.fechaLimite,
    respondidaEn: hoja.respuesta?.respondidaEn ?? null,
    fueraDePlazo: hoja.fueraDePlazo,
  };
}

/** Una fila de la lista de administración: estado, plazo, quién reclama y un resumen. */
export function verFila(hoja: HojaDeReclamacion, hoy: string) {
  const { nombres, apellidos } = hoja.consumidor;
  const resumen =
    hoja.detalle.length > LARGO_DEL_RESUMEN
      ? `${hoja.detalle.slice(0, LARGO_DEL_RESUMEN)}…`
      : hoja.detalle;
  return {
    ...estadoYPlazo(hoja, hoy),
    nombre: `${nombres} ${apellidos}`,
    resumen,
  };
}

/** La hoja completa para atenderla, con su respuesta y el registro de cambios. */
export function verParaAtender(
  hoja: HojaDeReclamacion,
  hoy: string,
  cambios: CambioRegistrado[],
) {
  return {
    ...verHoja(hoja),
    ...estadoYPlazo(hoja, hoy),
    abiertaEn: hoja.abiertaEn,
    respuesta: hoja.respuesta,
    cambios,
  };
}

export type FilaDeHoja = ReturnType<typeof verFila>;
export type HojaParaAtender = ReturnType<typeof verParaAtender>;
