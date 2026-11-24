import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import type { Cancha } from '../dominio/cancha.entity';
import { CanchaNoEncontradaError } from '../dominio/cancha-no-encontrada.error';
import type { CanchaRepository } from '../dominio/cancha.repository';
import type { ReservasDeCancha } from './reservas-de-cancha.port';
import { aVistaDeReserva } from './vista-de-cancha';

/** La cancha con ese id, o el error de que no existe. */
export async function buscarCancha(
  canchas: Pick<CanchaRepository, 'buscar'>,
  id: number,
): Promise<Cancha> {
  const cancha = await canchas.buscar(id);
  if (!cancha) throw new CanchaNoEncontradaError();
  return cancha;
}

/** Mensaje para un nombre que ya usa otra cancha. */
export function nombreOcupado(nombre: string): string {
  return `Ya existe una cancha llamada «${nombre}».`;
}

interface ComprobacionDeReservas {
  reservas: Pick<ReservasDeCancha, 'porJugar'>;
  canchaId: number;
  desde: Date;
  /** Qué no se puede hacer y por qué. */
  mensaje: string;
}

/** Rechaza el cambio si la cancha tiene reservas por jugar y devuelve cuáles son. */
export async function exigirSinReservasPorJugar({
  reservas,
  canchaId,
  desde,
  mensaje,
}: ComprobacionDeReservas): Promise<void> {
  const porJugar = await reservas.porJugar(canchaId, desde);
  if (porJugar.length === 0) return;
  throw new ConflictoError(
    mensaje,
    {},
    { reservas: porJugar.map(aVistaDeReserva) },
  );
}
