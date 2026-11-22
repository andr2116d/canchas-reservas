import type { Sesion } from '../../src/modulos/sesiones/dominio/sesion.entity';
import type { SesionRepository } from '../../src/modulos/sesiones/dominio/sesion.repository';

/** Repositorio en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaSesionRepository implements SesionRepository {
  private readonly sesiones = new Map<string, Sesion>();

  guardar(sesion: Sesion): Promise<void> {
    this.sesiones.set(sesion.tokenHash, sesion);
    return Promise.resolve();
  }

  buscarPorTokenHash(tokenHash: string): Promise<Sesion | undefined> {
    return Promise.resolve(this.sesiones.get(tokenHash));
  }

  actualizarActividad(sesion: Sesion): Promise<void> {
    return this.guardar(sesion);
  }

  /** Lista lo guardado, para que las pruebas lo inspeccionen. */
  todas(): Sesion[] {
    return [...this.sesiones.values()];
  }
}
