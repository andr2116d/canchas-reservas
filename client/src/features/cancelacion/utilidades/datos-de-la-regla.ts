import type { DatosDelRango } from "../esquemas/regla.schema";
import type { ReglaConsultada } from "../servicios/cancelacion";

const HORAS_SUGERIDAS = [3, 4, 6, 12, 24, 48, 72];

/** Rangos para el formulario: los de la regla vigente o, si no hay, la propuesta para empezar. */
export function rangosDelFormulario({ vigente, propuesta }: ReglaConsultada): DatosDelRango[] {
  return (vigente?.rangos ?? propuesta).map(({ desdeHoras, porcentaje, ofreceCredito }) => ({
    desdeHoras: String(desdeHoras),
    porcentaje: String(porcentaje),
    ofreceCredito,
  }));
}

/** De más a menos anticipación; los que aún no tienen horas válidas van al final. */
export function ordenarRangos(rangos: DatosDelRango[]): DatosDelRango[] {
  const horas = (rango: DatosDelRango) => (/^\d+$/.test(rango.desdeHoras.trim()) ? Number(rango.desdeHoras) : -1);
  return [...rangos].sort((a, b) => horas(b) - horas(a));
}

/** Un rango nuevo con unas horas que todavía no se usan y el porcentaje del rango con más anticipación. */
export function rangoNuevo(rangos: DatosDelRango[]): DatosDelRango {
  const usadas = new Set(rangos.map((rango) => Number(rango.desdeHoras)));
  const horas = HORAS_SUGERIDAS.find((posible) => !usadas.has(posible)) ?? Math.max(0, ...usadas) + 1;
  return { desdeHoras: String(horas), porcentaje: ordenarRangos(rangos)[0]?.porcentaje ?? "100", ofreceCredito: false };
}

/** Dónde va un rango nuevo para que la lista siga de más a menos anticipación. */
export function posicionDelRango(rangos: DatosDelRango[], nuevo: DatosDelRango): number {
  const posicion = rangos.findIndex((rango) => Number(rango.desdeHoras) < Number(nuevo.desdeHoras));
  return posicion === -1 ? rangos.length : posicion;
}

/** «1 h 30 min», «45 min», «2 h». */
export function duracionEnTexto(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}
