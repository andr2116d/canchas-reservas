import { horaDe, minutosDe } from "./horario";

// Las mismas reglas que aplica el server; el server decide al reservar.
const MINUTOS_MINIMOS_DEL_TURNO_CORTO = 30;

/** Horario de un día abierto, con su hora de noche ya resuelta. */
export interface HorarioDelDiaEnBorrador {
  abre: string;
  cierra: string;
  inicioDeLaNoche: string;
}

/** Tarifa tal como se está editando. */
export interface TarifaEnBorrador {
  precioDia: string;
  precioNoche: string;
  horas: number;
  ofreceTurnoCorto: boolean;
}

export interface TurnoCalculado {
  desde: string;
  hasta: string;
  corto: boolean;
  total: string;
  /** Solo si el turno cruza de día a noche. */
  partes?: { dia: string; noche: string };
}

export interface TurnosCalculados {
  turnos: TurnoCalculado[];
  /** Rato final que no se ofrece. */
  sinTurno?: { desde: string; hasta: string };
}

const centimosDe = (texto: string) => Math.round(Number(texto.replace(",", ".")) * 100);
const soles = (centimos: number) => (centimos / 100).toFixed(2);

/** Cada parte vale la tarifa de su franja por la fracción del turno completo que ocupa. */
function precioDelTurno(tarifa: TarifaEnBorrador, desde: number, hasta: number, noche: number) {
  const duracion = tarifa.horas * 60;
  const corte = Math.min(Math.max(desde, noche), hasta);
  const exactoDia = (centimosDe(tarifa.precioDia) * (corte - desde)) / duracion;
  const exactoNoche = (centimosDe(tarifa.precioNoche) * (hasta - corte)) / duracion;
  const total = Math.round(exactoDia + exactoNoche);
  const cruza = corte > desde && corte < hasta;
  const dia = Math.round(exactoDia);
  return { total: soles(total), ...(cruza && { partes: { dia: soles(dia), noche: soles(total - dia) } }) };
}

/**
 * Turnos seguidos desde la apertura, cada uno con su precio, y el rato final:
 * turno corto si la tarifa lo permite y dura al menos 30 minutos, o rato sin turno.
 */
export function calcularTurnos(dia: HorarioDelDiaEnBorrador, tarifa: TarifaEnBorrador): TurnosCalculados {
  const duracion = tarifa.horas * 60;
  const cierre = minutosDe(dia.cierra);
  const noche = minutosDe(dia.inicioDeLaNoche);
  const turno = (desde: number, hasta: number, corto: boolean): TurnoCalculado => ({
    desde: horaDe(desde),
    hasta: horaDe(hasta),
    corto,
    ...precioDelTurno(tarifa, desde, hasta, noche),
  });
  const turnos: TurnoCalculado[] = [];
  let inicio = minutosDe(dia.abre);
  for (; inicio + duracion <= cierre; inicio += duracion) turnos.push(turno(inicio, inicio + duracion, false));
  const sobrante = cierre - inicio;
  if (sobrante <= 0) return { turnos };
  if (tarifa.ofreceTurnoCorto && sobrante >= MINUTOS_MINIMOS_DEL_TURNO_CORTO) {
    return { turnos: [...turnos, turno(inicio, cierre, true)] };
  }
  return { turnos, sinTurno: { desde: horaDe(inicio), hasta: horaDe(cierre) } };
}
