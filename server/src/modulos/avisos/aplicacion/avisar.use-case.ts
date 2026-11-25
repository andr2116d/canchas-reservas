import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';
import type { AvisoRepository, TipoDeAviso } from '../dominio/aviso';

/** Deja un aviso para una persona o para cada cuenta de un rol. Lo usan los demás módulos. */
export class AvisarUseCase {
  constructor(
    private readonly avisos: AvisoRepository,
    private readonly reloj: Reloj,
  ) {}

  alRol(rol: RolUsuario, tipo: TipoDeAviso, referencia: string): Promise<void> {
    return this.avisos.crearParaRol(rol, {
      tipo,
      referencia,
      creadoEn: this.reloj.ahora(),
    });
  }

  a(usuarioId: number, tipo: TipoDeAviso, referencia: string): Promise<void> {
    return this.avisos.crearPara(usuarioId, {
      tipo,
      referencia,
      creadoEn: this.reloj.ahora(),
    });
  }
}
