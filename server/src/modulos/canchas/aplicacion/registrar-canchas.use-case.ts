import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import {
  ConflictoError,
  type ErroresPorCampo,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { Cancha, type DatosDeCancha } from '../dominio/cancha.entity';
import type { CanchaRepository } from '../dominio/cancha.repository';
import { nombreOcupado } from './comprobaciones-de-cancha';
import { aVista, type VistaDeCancha } from './vista-de-cancha';

/** Crea cada cancha y reúne los errores de todas, con su posición en la clave. */
function crearTodas(lista: DatosDeCancha[]): Cancha[] {
  const errores: ErroresPorCampo = {};
  const creadas = lista.flatMap((datos, indice) => {
    try {
      return [Cancha.crear(datos)];
    } catch (error) {
      if (!(error instanceof ReglaInvalidaError)) throw error;
      for (const [campo, mensaje] of Object.entries(error.errores))
        errores[`canchas.${indice}.${campo}`] = mensaje;
      return [];
    }
  });
  if (Object.keys(errores).length > 0) throw new ReglaInvalidaError(errores);
  return creadas;
}

function exigirNombresDistintos(canchas: Cancha[]): void {
  const errores: ErroresPorCampo = {};
  const vistos = new Set<string>();
  canchas.forEach((cancha, indice) => {
    if (vistos.has(cancha.nombreNormalizado))
      errores[`canchas.${indice}.nombre`] =
        'Este nombre se repite en la lista.';
    vistos.add(cancha.nombreNormalizado);
  });
  if (Object.keys(errores).length > 0) throw new ReglaInvalidaError(errores);
}

/**
 * Registra una o varias canchas a la vez: se crean todas o ninguna. Cada una
 * empieza operativa y deja su alta en la auditoría.
 */
export class RegistrarCanchasUseCase {
  constructor(
    private readonly canchas: Pick<
      CanchaRepository,
      'nombresOcupados' | 'registrar'
    >,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    lista: DatosDeCancha[],
    administradorId: number,
  ): Promise<VistaDeCancha[]> {
    const nuevas = crearTodas(lista);
    exigirNombresDistintos(nuevas);
    await this.exigirNombresLibres(nuevas);
    const creadas = await this.canchas.registrar(nuevas, {
      ejecutadoPorId: administradorId,
      ocurridoEn: this.reloj.ahora(),
    });
    return creadas.map((cancha) => aVista(cancha, true));
  }

  private async exigirNombresLibres(nuevas: Cancha[]): Promise<void> {
    const ocupados = new Set(
      await this.canchas.nombresOcupados(
        nuevas.map((c) => c.nombreNormalizado),
      ),
    );
    const errores: ErroresPorCampo = {};
    nuevas.forEach((cancha, indice) => {
      if (ocupados.has(cancha.nombreNormalizado))
        errores[`canchas.${indice}.nombre`] = nombreOcupado(
          cancha.ficha.nombre,
        );
    });
    if (Object.keys(errores).length > 0)
      throw new ConflictoError('Hay nombres que ya usa otra cancha.', errores);
  }
}
