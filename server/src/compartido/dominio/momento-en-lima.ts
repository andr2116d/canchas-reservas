import { HoraDelDia } from './hora-del-dia.value-object';
import { ValorInvalidoError } from './valor-invalido.error';

// Perú no usa horario de verano: Lima está en UTC−5 todo el año.
const MINUTOS_DE_LIMA_DETRAS_DE_UTC = 5 * 60;
const MS_POR_MINUTO = 60 * 1000;
const FORMATO_DE_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Revisa una fecha `AAAA-MM-DD` que exista en el calendario. */
export function leerFecha(texto: string): string {
  const partes = FORMATO_DE_FECHA.exec(texto.trim());
  const fecha =
    partes && new Date(Date.UTC(+partes[1], +partes[2] - 1, +partes[3]));
  if (
    !partes ||
    !fecha ||
    fecha.getUTCDate() !== +partes[3] ||
    fecha.getUTCMonth() !== +partes[2] - 1
  )
    throw new ValorInvalidoError('Ingresa una fecha válida.');
  return partes[0];
}

/** El instante de una fecha y hora de Lima. Admite 24:00, que es el inicio del día siguiente. */
export function momentoEnLima(fecha: string, hora: string): Date {
  const [anio, mes, dia] = leerFecha(fecha).split('-').map(Number);
  const { minutos } = HoraDelDia.crearHastaMedianoche(hora);
  const medianocheEnUtc = Date.UTC(anio, mes - 1, dia);
  return new Date(
    medianocheEnUtc + (minutos + MINUTOS_DE_LIMA_DETRAS_DE_UTC) * MS_POR_MINUTO,
  );
}

/** La fecha `AAAA-MM-DD` de Lima en ese instante. */
export function fechaEnLima(momento: Date): string {
  const enLima = new Date(
    momento.getTime() - MINUTOS_DE_LIMA_DETRAS_DE_UTC * MS_POR_MINUTO,
  );
  return enLima.toISOString().slice(0, 10);
}

/** Suma días o meses a una fecha; si el mes de destino no tiene ese día, usa el último. */
export function sumarAFecha(
  fecha: string,
  { dias = 0, meses = 0 }: { dias?: number; meses?: number },
): string {
  const [anio, mes, dia] = leerFecha(fecha).split('-').map(Number);
  const ultimoDelMes = new Date(
    Date.UTC(anio, mes - 1 + meses + 1, 0),
  ).getUTCDate();
  const destino = new Date(
    Date.UTC(anio, mes - 1 + meses, Math.min(dia, ultimoDelMes) + dias),
  );
  return destino.toISOString().slice(0, 10);
}
