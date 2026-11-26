import type { GeneradorDeCodigo } from '../../../src/modulos/reclamos/aplicacion/generador-de-codigo.port';

/** Siempre el mismo código, para poder buscarlo en la prueba. */
export class GeneradorDeCodigoDePrueba implements GeneradorDeCodigo {
  constructor(private readonly codigo = 'K7QP4ZMD') {}

  generar(): string {
    return this.codigo;
  }
}
