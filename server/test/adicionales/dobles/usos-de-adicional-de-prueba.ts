import type { UsosDeAdicional } from '../../../src/modulos/adicionales/aplicacion/usos-de-adicional.port';

/** Usos que la prueba marca a mano. */
export class UsosDeAdicionalDePrueba implements UsosDeAdicional {
  private readonly usados = new Set<number>();

  usar(adicionalId: number): void {
    this.usados.add(adicionalId);
  }

  conUsos(adicionalIds: number[]): Promise<Set<number>> {
    return Promise.resolve(
      new Set(adicionalIds.filter((id) => this.usados.has(id))),
    );
  }
}
