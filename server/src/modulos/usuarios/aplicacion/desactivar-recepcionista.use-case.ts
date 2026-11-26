import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import {
  aplicarCambioAuditado,
  type RepositorioDeCambios,
} from './cambio-de-recepcionista';

/**
 * Desactiva una cuenta de recepción: no puede iniciar sesión, sus sesiones se
 * cierran y sus datos e historial se conservan para auditorías o un reingreso.
 */
export class DesactivarRecepcionistaUseCase {
  constructor(
    private readonly recepcionistas: RepositorioDeCambios,
    private readonly reloj: Reloj,
  ) {}

  ejecutar(id: number, administradorId: number): Promise<void> {
    return aplicarCambioAuditado(this.recepcionistas, {
      id,
      cambios: {
        estado: 'INACTIVO',
        estadoEsperado: 'ACTIVO',
        cerrarSesiones: true,
      },
      accion: {
        accion: 'DESACTIVACION',
        ejecutadoPorId: administradorId,
        ocurridoEn: this.reloj.ahora(),
      },
      siNoAplica: 'Esta cuenta ya está desactivada.',
    });
  }
}
