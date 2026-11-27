import type {
  AdicionalOfrecido,
  CatalogoDeAdicionales,
} from '../../../src/modulos/reservas/aplicacion/catalogo-de-adicionales.port';
import type { GeneradorDeCodigo } from '../../../src/modulos/reservas/aplicacion/generador-de-codigo.port';
import type {
  DatosDelTitular,
  Titulares,
} from '../../../src/modulos/reservas/aplicacion/titulares.port';

export class CatalogoDePrueba implements CatalogoDeAdicionales {
  readonly adicionales: AdicionalOfrecido[] = [];

  activos(): Promise<AdicionalOfrecido[]> {
    return Promise.resolve(this.adicionales);
  }
}

export class TitularesDePrueba implements Titulares {
  readonly cuentas = new Map<number, DatosDelTitular>();

  datosDe(usuarioId: number): Promise<DatosDelTitular | undefined> {
    return Promise.resolve(this.cuentas.get(usuarioId));
  }
}

/** Entrega los códigos en el orden dado y después inventa otros. */
export class CodigosDePrueba implements GeneradorDeCodigo {
  private siguiente = 0;

  constructor(private readonly codigos: string[] = []) {}

  nuevo(): string {
    this.siguiente += 1;
    return (
      this.codigos.shift() ?? `RSV${String(this.siguiente).padStart(3, '2')}`
    );
  }
}
