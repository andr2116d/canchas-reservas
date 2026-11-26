import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { DatosDeAdicional } from '../dominio/adicional.entity';
import type { AdicionalRepository } from '../dominio/adicional.repository';
import {
  buscarAdicional,
  exigirNombreLibre,
} from './comprobaciones-de-adicional';
import type { UsosDeAdicional } from './usos-de-adicional.port';
import { aVista, type VistaDeAdicional } from './vista-de-adicional';

/**
 * Edita el nombre, la descripción o el precio. Deja en la auditoría el valor
 * anterior y el nuevo; guardar los mismos datos no deja registro. Un precio
 * nuevo rige solo para los cobros que vengan.
 */
export class EditarAdicionalUseCase {
  constructor(
    private readonly adicionales: Pick<
      AdicionalRepository,
      'buscar' | 'nombreOcupado' | 'guardar'
    >,
    private readonly usos: UsosDeAdicional,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    id: number,
    datos: DatosDeAdicional,
    administradorId: number,
  ): Promise<VistaDeAdicional> {
    const adicional = await buscarAdicional(this.adicionales, id);
    const cambios = adicional.editar(datos);
    if (Object.keys(cambios).length > 0) {
      if (cambios.nombre) await exigirNombreLibre(this.adicionales, adicional);
      await this.adicionales.guardar(adicional, {
        accion: 'EDICION',
        detalle: cambios,
        ejecutadoPorId: administradorId,
        ocurridoEn: this.reloj.ahora(),
      });
    }
    const usados = await this.usos.conUsos([id]);
    return aVista(adicional, !usados.has(id));
  }
}
