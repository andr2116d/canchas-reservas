import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import {
  aplicarCambioAuditado,
  prepararContrasenaTemporal,
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
    const temporal = await prepararContrasenaTemporal(
      contrasenaTemporal,
      this.hasheador,
      this.reloj.ahora(),
    );
    await aplicarCambioAuditado(this.recepcionistas, {
      id,
      cambios: {
        contrasenaTemporal: temporal,
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
