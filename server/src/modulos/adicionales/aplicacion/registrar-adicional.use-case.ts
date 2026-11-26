import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { Adicional, type DatosDeAdicional } from '../dominio/adicional.entity';
import type { AdicionalRepository } from '../dominio/adicional.repository';
import { exigirNombreLibre } from './comprobaciones-de-adicional';
import { aVista, type VistaDeAdicional } from './vista-de-adicional';

/** Agrega un adicional al catálogo. Empieza activo y deja su alta, con sus valores, en la auditoría. */
export class RegistrarAdicionalUseCase {
  constructor(
    private readonly adicionales: Pick<
      AdicionalRepository,
      'nombreOcupado' | 'registrar'
    >,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    datos: DatosDeAdicional,
    administradorId: number,
  ): Promise<VistaDeAdicional> {
    const nuevo = Adicional.crear(datos);
    await exigirNombreLibre(this.adicionales, nuevo);
    const creado = await this.adicionales.registrar(nuevo, {
      ejecutadoPorId: administradorId,
      ocurridoEn: this.reloj.ahora(),
    });
    return aVista(creado, true);
  }
}
