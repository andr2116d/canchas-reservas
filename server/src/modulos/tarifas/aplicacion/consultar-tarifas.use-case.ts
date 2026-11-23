import type { TarifaRepository } from '../dominio/tarifa.repository';
import { TIPOS_DE_CANCHA, type TipoDeCancha } from '../dominio/tipo-de-cancha';
import { aVista, type VistaDeTarifa } from './vista-de-tarifa';

export interface TarifaDelTipo {
  tipo: TipoDeCancha;
  /** Nada si el tipo todavía no tiene tarifa. */
  vigente?: VistaDeTarifa;
  /** Versiones guardadas, de la más reciente a la más antigua. */
  historial: VistaDeTarifa[];
}

/** Tarifa vigente de cada tipo de cancha y su historial. */
export class ConsultarTarifasUseCase {
  constructor(private readonly tarifas: Pick<TarifaRepository, 'historial'>) {}

  async ejecutar(): Promise<{ tarifas: TarifaDelTipo[] }> {
    const tarifas = await Promise.all(
      TIPOS_DE_CANCHA.map(async (tipo) => {
        const historial = (await this.tarifas.historial(tipo)).map(aVista);
        return { tipo, vigente: historial[0], historial };
      }),
    );
    return { tarifas };
  }
}
