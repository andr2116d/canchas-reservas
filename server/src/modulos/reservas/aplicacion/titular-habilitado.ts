import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { FechaNacimiento } from '../../usuarios/api-usuarios';
import { TitularNoHabilitadoError } from '../dominio/titular-no-habilitado.error';
import type { Titulares } from './titulares.port';

/** Exige una cuenta de jugador activa de una persona con 18 años cumplidos hoy, en Lima. */
export async function exigirTitularHabilitado(
  titulares: Titulares,
  usuarioId: number,
  ahora: Date,
): Promise<void> {
  const titular = await titulares.datosDe(usuarioId);
  if (!titular?.esJugadorActivo || !titular.fechaNacimiento)
    throw new TitularNoHabilitadoError();
  try {
    FechaNacimiento.crear(titular.fechaNacimiento, ahora);
  } catch (error) {
    if (error instanceof ValorInvalidoError)
      throw new TitularNoHabilitadoError();
    throw error;
  }
}
