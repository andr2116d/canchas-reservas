import {
  fechaEnLima,
  sumarAFecha,
} from '../../../compartido/dominio/momento-en-lima';

/** Ley 29571, art. 24.1, y DS 011-2011-PCM, arts. 6 y 6-B: 15 días hábiles improrrogables. */
export const DIAS_HABILES_PARA_RESPONDER = 15;

// Decisión del local: se cuenta de lunes a viernes y los feriados no se saltan,
// así el plazo nunca queda más largo que el legal.
function esDiaHabil(fecha: string): boolean {
  const dia = new Date(`${fecha}T12:00:00.000Z`).getUTCDay();
  return dia !== 0 && dia !== 6;
}

/** La fecha de Lima en que vence el plazo, contando desde el día siguiente al registro. */
export function fechaLimiteDeRespuesta(registradaEn: Date): string {
  let fecha = fechaEnLima(registradaEn);
  let contados = 0;
  while (contados < DIAS_HABILES_PARA_RESPONDER) {
    fecha = sumarAFecha(fecha, { dias: 1 });
    if (esDiaHabil(fecha)) contados++;
  }
  return fecha;
}

function habilesEntre(desde: string, hasta: string): number {
  let contados = 0;
  for (
    let f = sumarAFecha(desde, { dias: 1 });
    f <= hasta;
    f = sumarAFecha(f, { dias: 1 })
  ) {
    if (esDiaHabil(f)) contados++;
  }
  return contados;
}

/** Días hábiles que quedan hasta la fecha límite; 0 el día que vence y negativo si ya venció. */
export function diasHabilesRestantes(hoy: string, fechaLimite: string): number {
  return hoy <= fechaLimite
    ? habilesEntre(hoy, fechaLimite)
    : -habilesEntre(fechaLimite, hoy);
}
