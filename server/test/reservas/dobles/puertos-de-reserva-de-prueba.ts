import { MinutosParaPagar } from '../../../src/modulos/plazo-de-pago/api-plazo-de-pago';
import type {
  AdicionalOfrecido,
  CatalogoDeAdicionales,
} from '../../../src/modulos/reservas/aplicacion/catalogo-de-adicionales.port';
import type { AvisosDeReserva } from '../../../src/modulos/reservas/aplicacion/avisos-de-reserva.port';
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

/** Guarda los códigos de las reservas avisadas. */
export class AvisosDeReservaDePrueba implements AvisosDeReserva {
  readonly nuevas: string[] = [];

  nuevaReserva(codigo: string): Promise<void> {
    this.nuevas.push(codigo);
    return Promise.resolve();
  }
}

/** El plazo para pagar que rige; empieza en los 15 minutos por defecto. */
export class PlazoDePrueba {
  minutos = 15;

  ejecutar(): Promise<MinutosParaPagar> {
    return Promise.resolve(MinutosParaPagar.restaurar(this.minutos));
  }
}
