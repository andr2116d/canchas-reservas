import type { EscuchaDeCambios } from '../../../src/modulos/disponibilidad/aplicacion/escucha-de-cambios.port';

/** Escucha que no se conecta a nada; la prueba avisa un cambio con `cambiar()`. */
export class EscuchaDeCambiosDePrueba implements EscuchaDeCambios {
  private alCambiar: () => void = () => undefined;

  escuchar(alCambiar: () => void): Promise<void> {
    this.alCambiar = alCambiar;
    return Promise.resolve();
  }

  dejarDeEscuchar(): Promise<void> {
    return Promise.resolve();
  }

  cambiar(): void {
    this.alCambiar();
  }
}
