import {
  elegirDeLista,
  opcional,
} from '../../../compartido/dominio/consulta-paginada';
import { leerId } from '../../../compartido/dominio/id';
import { leerFecha } from '../../../compartido/dominio/momento-en-lima';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import type { EstadoDeReserva } from './reserva.repository';

export const ESTADOS_DE_RESERVA: readonly EstadoDeReserva[] = [
  'PENDIENTE_DE_PAGO',
  'PENDIENTE_DE_VALIDACION',
  'CONFIRMADA',
  'EN_JUEGO',
  'EXPIRADA',
  'CANCELADA',
  'AUSENTE',
  'FINALIZADA',
];

const esEstado = (texto: string): texto is EstadoDeReserva =>
  (ESTADOS_DE_RESERVA as readonly string[]).includes(texto);

/** Filtros tal como llegan en la consulta; todos opcionales. */
export interface DatosDeLaAgenda {
  fecha?: string;
  canchaId?: string;
  estado?: string;
}

export interface FiltroDeLaAgenda {
  fecha: string;
  canchaId?: number;
  estado?: EstadoDeReserva;
}

interface LimitesDeLaAgenda {
  hoy: string;
  ultimaFecha: string;
  canchaIds: number[];
}

function leerFechaDeLaAgenda(texto: string, ultimaFecha: string): string {
  const fecha = leerFecha(texto);
  if (fecha > ultimaFecha)
    throw new ValorInvalidoError(
      'Solo se pueden consultar los próximos 30 días.',
    );
  return fecha;
}

function leerCancha(texto: string, canchaIds: number[]): number {
  const id = leerId(texto);
  if (!canchaIds.includes(id))
    throw new ValorInvalidoError('Elige una cancha de la lista.');
  return id;
}

/** Sin fecha es hoy. Los días pasados se consultan; los futuros, hasta donde se puede reservar. */
export function leerFiltroDeLaAgenda(
  datos: DatosDeLaAgenda,
  { hoy, ultimaFecha, canchaIds }: LimitesDeLaAgenda,
): FiltroDeLaAgenda {
  return validarCampos({
    fecha: () =>
      opcional(datos.fecha, (t) => leerFechaDeLaAgenda(t, ultimaFecha)) ?? hoy,
    canchaId: () => opcional(datos.canchaId, (t) => leerCancha(t, canchaIds)),
    estado: () =>
      opcional(datos.estado, (t) =>
        elegirDeLista(t, esEstado, 'Elige un estado de la lista.'),
      ),
  });
}
