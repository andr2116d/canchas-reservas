import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { Sesion, type SesionNueva } from '../dominio/sesion.entity';
import type { SesionRepository } from '../dominio/sesion.repository';
import type { GeneradorTokenSesion } from './generador-token-sesion.port';

export interface SesionAbierta {
  /** Se entrega una sola vez, para la cookie; en la base solo queda su hash. */
  token: string;
  expiraEn: Date;
}

interface SesionPreparada {
  datosDeSesion: SesionNueva;
  credencial: SesionAbierta;
}

/** Inicia la sesión de un usuario ya autenticado o recién registrado. */
export class AbrirSesionUseCase {
  constructor(
    private readonly sesiones: SesionRepository,
    private readonly generador: GeneradorTokenSesion,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(usuarioId: number): Promise<SesionAbierta> {
    const { datosDeSesion, credencial } = this.preparar();
    await this.sesiones.guardar(Sesion.abrir(usuarioId, datosDeSesion));
    return credencial;
  }

  /** Prepara una sesión para guardarla junto con una cuenta nueva. */
  preparar(dispositivo?: string): SesionPreparada {
    const token = this.generador.generar();
    const datosDeSesion = Sesion.preparar(
      this.generador.hashear(token),
      this.reloj.ahora(),
      dispositivo,
    );
    return {
      datosDeSesion,
      credencial: { token, expiraEn: datosDeSesion.expiraEn },
    };
  }
}
