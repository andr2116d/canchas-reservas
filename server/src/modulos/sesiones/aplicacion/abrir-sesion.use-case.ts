import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { Sesion } from '../dominio/sesion.entity';
import type { SesionRepository } from '../dominio/sesion.repository';
import type { GeneradorTokenSesion } from './generador-token-sesion.port';

export interface SesionAbierta {
  /** Se entrega una sola vez, para la cookie; en la base solo queda su hash. */
  token: string;
  expiraEn: Date;
}

/** Inicia la sesión de un usuario ya autenticado o recién registrado. */
export class AbrirSesionUseCase {
  constructor(
    private readonly sesiones: SesionRepository,
    private readonly generador: GeneradorTokenSesion,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(usuarioId: number): Promise<SesionAbierta> {
    const token = this.generador.generar();
    const sesion = Sesion.abrir(
      usuarioId,
      this.generador.hashear(token),
      this.reloj.ahora(),
    );
    await this.sesiones.guardar(sesion);
    return { token, expiraEn: sesion.expiraEn };
  }
}
