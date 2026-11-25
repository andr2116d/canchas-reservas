import type { EstadoDelFiltro, FiltroDeHojas } from './filtro-de-hojas';
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

export type AccionSobreHoja =
  'APERTURA' | 'CLASIFICACION' | 'CAMBIO_DE_TIPO' | 'RESPUESTA';

/** Quién hace un cambio y cuándo; queda en la auditoría. */
export interface Autoria {
  ejecutadoPorId: number;
  ocurridoEn: Date;
}

/** Un cambio en la atención de una hoja tal como se guarda en la auditoría. */
export interface CambioDeLaHoja extends Autoria {
  accion: AccionSobreHoja;
  detalle?: Record<string, unknown>;
}

/** Un cambio leído de la auditoría, con el nombre de quien lo hizo. */
export interface CambioRegistrado {
  accion: AccionSobreHoja;
  ejecutadoPor: string;
  ocurridoEn: Date;
  detalle: Record<string, unknown> | null;
}

/** Una página de la lista de administración, con cuántas hay en cada estado para los filtros. */
export interface PaginaDeHojas {
  hojas: HojaDeReclamacion[];
  total: number;
  conteos: Record<EstadoDelFiltro, number>;
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

  /** Para administración. Los conteos aplican los demás filtros pero no el de estado. */
  listar(filtro: FiltroDeHojas, hoy: string): Promise<PaginaDeHojas>;

  buscar(numero: NumeroDeHoja): Promise<HojaDeReclamacion | undefined>;

  /** La pasa a «en atención» solo si sigue nueva; devuelve si la abrió esta llamada. */
  registrarApertura(
    hoja: HojaDeReclamacion,
    autoria: Autoria,
  ): Promise<boolean>;

  /** Guarda la hoja leída y su cambio en la auditoría; falla si cambió mientras tanto. */
  guardar(hoja: HojaDeReclamacion, cambio: CambioDeLaHoja): Promise<void>;

  /** La auditoría de la hoja, del más antiguo al más reciente. */
  cambiosDe(hoja: HojaDeReclamacion): Promise<CambioRegistrado[]>;
}
