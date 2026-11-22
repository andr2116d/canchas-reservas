import type { Sesion } from '../../src/modulos/sesiones/dominio/sesion.entity';
import type {
  SesionConAcceso,
  SesionRepository,
} from '../../src/modulos/sesiones/dominio/sesion.repository';

/** Repositorio en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaSesionRepository implements SesionRepository {
  private readonly sesiones = new Map<string, Sesion>();

  guardar(sesion: Sesion): Promise<void> {
    this.sesiones.set(sesion.tokenHash, sesion);
    return Promise.resolve();
  }

  buscarPorTokenHash(tokenHash: string): Promise<SesionConAcceso | undefined> {
    const sesion = this.sesiones.get(tokenHash);
    return Promise.resolve(
      sesion && {
        sesion,
        activa: true,
        rol: 'JUGADOR',
        requiereCambiarContrasena: false,
      },
    );
  }

  async actualizarActividad(sesion: Sesion): Promise<boolean> {
    if (!this.sesiones.has(sesion.tokenHash)) return false;
    await this.guardar(sesion);
    return true;
  }

  eliminar(tokenHash: string): Promise<void> {
    this.sesiones.delete(tokenHash);
    return Promise.resolve();
  }

  /** Lista lo guardado, para que las pruebas lo inspeccionen. */
  todas(): Sesion[] {
    return [...this.sesiones.values()];
  }
}
