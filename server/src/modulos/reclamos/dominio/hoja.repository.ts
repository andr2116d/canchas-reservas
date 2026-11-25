import type { HojaDeReclamacion } from './hoja-de-reclamacion.entity';
import type { NumeroDeHoja } from './numero-de-hoja.value-object';

export const HOJA_REPOSITORY = Symbol('HOJA_REPOSITORY');

/** Lo que se guarda junto con la hoja al registrarla. */
export interface RegistroDeHoja {
  /** El código de seguimiento; el repositorio guarda solo su hash. */
  codigo: string;
  /** La cuenta de jugador si reclamó con sesión iniciada. */
  titularId: number | null;
}

/** Puerto de las hojas del Libro de Reclamaciones. Las hojas no se borran. */
export interface HojaRepository {
  /** La guarda con el siguiente correlativo del año en que se registró y devuelve su número. */
  registrar(
    hoja: HojaDeReclamacion,
    registro: RegistroDeHoja,
  ): Promise<NumeroDeHoja>;

  /** La hoja con ese número solo si el código de seguimiento coincide. */
  buscarPorSeguimiento(
    numero: NumeroDeHoja,
    codigo: string,
  ): Promise<HojaDeReclamacion | undefined>;

  /** Las hojas que registró un jugador con su cuenta, la más reciente primero. */
  delTitular(titularId: number): Promise<HojaDeReclamacion[]>;

  /** Una hoja del jugador; no da la de otra persona. */
  buscarDelTitular(
    titularId: number,
    numero: NumeroDeHoja,
  ): Promise<HojaDeReclamacion | undefined>;
}
