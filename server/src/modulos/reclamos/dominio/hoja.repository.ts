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
}
