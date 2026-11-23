import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import {
  aplicarCambioAuditado,
  hashearContrasenaTemporal,
  type RepositorioDeCambios,
} from './cambio-de-recepcionista';
import type { HasheadorContrasena } from './hasheador-contrasena.port';

/**
 * El administrador asigna una contraseña temporal nueva a una recepcionista
 * activa. Sus sesiones se cierran y debe cambiarla al volver a entrar.
 */
export class RestablecerContrasenaUseCase {
  constructor(
    private readonly recepcionistas: RepositorioDeCambios,
    private readonly hasheador: HasheadorContrasena,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    id: number,
    contrasenaTemporal: string,
    administradorId: number,
  ): Promise<void> {
    const contrasenaHashTemporal = await hashearContrasenaTemporal(
      contrasenaTemporal,
      this.hasheador,
    );
    await aplicarCambioAuditado(this.recepcionistas, {
      id,
      cambios: {
        contrasenaHashTemporal,
        estadoEsperado: 'ACTIVO',
        cerrarSesiones: true,
      },
      accion: {
        accion: 'RESTABLECIMIENTO_DE_CONTRASENA',
        ejecutadoPorId: administradorId,
        ocurridoEn: this.reloj.ahora(),
      },
      siNoAplica: 'Reactiva la cuenta antes de restablecer su contraseña.',
    });
  }
}
