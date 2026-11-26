import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { TarifaRepository } from '../dominio/tarifa.repository';
import { construirTarifa, type DatosDeTarifa } from './construir-tarifa';
import { exigirTipoDeCancha } from './tipo-pedido';
import { aVista, type VistaDeTarifa } from './vista-de-tarifa';

export type { DatosDeTarifa };

/**
 * Define la tarifa de un tipo de cancha. Rige desde que se guarda: las reservas
 * hechas antes conservan su precio. Guardar los mismos valores no es un cambio.
 */
export class DefinirTarifaUseCase {
  constructor(
    private readonly tarifas: Pick<TarifaRepository, 'guardarSiCambia'>,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    tipoPedido: string,
    datos: DatosDeTarifa,
    administradorId: number,
  ): Promise<{ cambio: boolean; vigente: VistaDeTarifa }> {
    const tipo = exigirTipoDeCancha(tipoPedido);
    const tarifa = construirTarifa(tipo, datos);
    const { cambio, version } = await this.tarifas.guardarSiCambia(
      tarifa,
      administradorId,
      this.reloj.ahora(),
    );
    return { cambio, vigente: aVista(version) };
  }
}
