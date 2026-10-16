import { hoyEnLima } from "@/lib/formato";

export const DIAS_MAXIMO = 30;

/** Suma días a una fecha "YYYY-MM-DD" sin pasar por la zona horaria del navegador. */
export function sumarDias(iso: string, dias: number) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return fecha.toISOString().slice(0, 10);
}

export function limiteInferior() {
  return hoyEnLima();
}

export function limiteSuperior() {
  return sumarDias(hoyEnLima(), DIAS_MAXIMO);
}

/** Comparación de cadenas: "YYYY-MM-DD" ordena igual que las fechas. */
export function dentroDeRango(fecha: string) {
  return fecha >= limiteInferior() && fecha <= limiteSuperior();
}
