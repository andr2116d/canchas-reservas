import {
  fechaEnLima,
  momentoEnLima,
} from '../../../compartido/dominio/momento-en-lima';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

export interface VentanaDeLlegada {
  minutosAntes: number;
  minutosDespues: number;
}

export const VENTANA_INICIAL = {
  minutosAntes: 30,
  minutosDespues: 15,
} as const;

export function leerMinutos(valor: number): number {
  if (!Number.isInteger(valor) || valor < 0 || valor > 120) {
    throw new ValorInvalidoError('Ingresa un número entero de 0 a 120.');
  }
  return valor;
}

export function limitesDeLlegada(
  inicio: Date,
  ventana: VentanaDeLlegada = VENTANA_INICIAL,
) {
  const fecha = fechaEnLima(inicio);
  const desde = Math.max(
    inicio.getTime() - ventana.minutosAntes * 60_000,
    momentoEnLima(fecha, '00:00').getTime(),
  );
  const hasta = Math.min(
    inicio.getTime() + ventana.minutosDespues * 60_000,
    momentoEnLima(fecha, '24:00').getTime() - 1,
  );
  return { desde: new Date(desde), hasta: new Date(hasta) };
}
