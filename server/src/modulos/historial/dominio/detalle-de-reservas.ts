import { enSoles, type LineaDeDetalle, rangoEnLima } from './linea-de-detalle';

const NOMBRE_DEL_CANAL: Record<string, string> = {
  web: 'Web',
  recepcion: 'Recepción',
};

const texto = (valor: unknown) => (typeof valor === 'string' ? valor : null);

/** Lo que guardó una reserva al separarse: cancha, turno, montos y por dónde se hizo. */
export function detalleDeReserva(
  detalle: Record<string, unknown>,
): LineaDeDetalle[] {
  const [inicio, fin] = [texto(detalle.inicio), texto(detalle.fin)];
  const [precio, adelanto] = [texto(detalle.precio), texto(detalle.adelanto)];
  const canal = texto(detalle.canal);
  return [
    { campo: 'Cancha', antes: null, despues: texto(detalle.cancha) },
    {
      campo: 'Turno',
      antes: null,
      despues: inicio && fin ? rangoEnLima(inicio, fin) : null,
    },
    { campo: 'Precio', antes: null, despues: precio && enSoles(precio) },
    { campo: 'Adelanto', antes: null, despues: adelanto && enSoles(adelanto) },
    {
      campo: 'Canal',
      antes: null,
      despues: canal && (NOMBRE_DEL_CANAL[canal] ?? canal),
    },
  ];
}
