import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import {
  aplicarCambioAuditado,
  hashearContrasenaTemporal,
  type RepositorioDeCambios,
} from './cambio-de-recepcionista';
import type { HasheadorContrasena } from './hasheador-contrasena.port';

/**
 * Reactiva una cuenta de recepción con sus datos e historial. Recibe una
 * contraseña temporal nueva, porque la anterior pudo quedar expuesta.
 */
export class ReactivarRecepcionistaUseCase {
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
        estado: 'ACTIVO',
        estadoEsperado: 'INACTIVO',
        contrasenaHashTemporal,
      },
      accion: {
        accion: 'REACTIVACION',
        ejecutadoPorId: administradorId,
        ocurridoEn: this.reloj.ahora(),
      },
      siNoAplica: 'Esta recepcionista ya está activa.',
    });
  }
}
