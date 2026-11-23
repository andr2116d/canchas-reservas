import type { Sesion } from '../../src/modulos/sesiones/dominio/sesion.entity';
import type { AccesoDeSesion } from '../../src/modulos/sesiones/dominio/permisos-de-sesion';
import type {
  SesionConAcceso,
  SesionRepository,
} from '../../src/modulos/sesiones/dominio/sesion.repository';

/** Repositorio en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaSesionRepository implements SesionRepository {
  private readonly sesiones = new Map<string, Sesion>();
  private readonly omitidas = new Set<string>();

  /** @param acceso rol y estado de la contraseña de la persona de todas las sesiones. */
  constructor(
    private readonly acceso: AccesoDeSesion = {
      rol: 'JUGADOR',
      requiereCambiarContrasena: false,
    },
  ) {}

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
        ...this.acceso,
        cambioOmitido: this.omitidas.has(tokenHash),
      },
    );
  }

  async actualizarActividad(sesion: Sesion): Promise<boolean> {
    if (!this.sesiones.has(sesion.tokenHash)) return false;
    await this.guardar(sesion);
    return true;
  }

  omitirCambio(tokenHash: string): Promise<void> {
    this.omitidas.add(tokenHash);
    return Promise.resolve();
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
