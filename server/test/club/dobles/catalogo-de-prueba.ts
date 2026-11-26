import type {
  AdicionalDelClub,
  CanchaDelClub,
  CatalogoDelClub,
} from '../../../src/modulos/club/aplicacion/catalogo-del-club.port';

/** Canchas operativas y adicionales activos que la prueba arma a mano. */
export class CatalogoDePrueba implements CatalogoDelClub {
  readonly canchas: CanchaDelClub[] = [];
  readonly adicionales: AdicionalDelClub[] = [];

  canchasOperativas(): Promise<CanchaDelClub[]> {
    return Promise.resolve(this.canchas);
  }

  adicionalesActivos(): Promise<AdicionalDelClub[]> {
    return Promise.resolve(this.adicionales);
  }
}
