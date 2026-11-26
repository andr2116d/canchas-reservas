import type { RolUsuario } from '../../../src/compartido/dominio/rol-usuario';
import type { TipoDeAviso } from '../../../src/modulos/avisos/dominio/aviso';

/** Reemplaza al envío de avisos: guarda a quién se avisó y de qué. */
export class AvisosDePrueba {
  readonly enviados: {
    para: RolUsuario | number;
    tipo: TipoDeAviso;
    referencia: string;
  }[] = [];

  alRol(rol: RolUsuario, tipo: TipoDeAviso, referencia: string): Promise<void> {
    this.enviados.push({ para: rol, tipo, referencia });
    return Promise.resolve();
  }

  a(usuarioId: number, tipo: TipoDeAviso, referencia: string): Promise<void> {
    this.enviados.push({ para: usuarioId, tipo, referencia });
    return Promise.resolve();
  }
}
