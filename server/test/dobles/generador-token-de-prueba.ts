import type { GeneradorTokenSesion } from '../../src/modulos/sesiones/aplicacion/generador-token-sesion.port';

/** Tokens predecibles (`token-1`, `token-2`…) para poder buscarlos en la prueba. */
export class GeneradorTokenDePrueba implements GeneradorTokenSesion {
  private siguiente = 1;

  generar(): string {
    return `token-${this.siguiente++}`;
  }

  hashear(token: string): string {
    return `hash(${token})`;
  }
}
