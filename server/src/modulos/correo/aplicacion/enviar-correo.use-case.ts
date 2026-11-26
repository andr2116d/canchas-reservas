import type { Correo } from '../dominio/correo';
import type { BandejaDeSalida } from './bandeja-de-salida.port';
import type { RepartoDeCorreos } from './reparto-de-correos';

/**
 * Deja un correo del servicio en la bandeja de salida y dispara el reparto sin esperarlo:
 * quien pide el envío no depende de que el servidor de correo responda.
 */
export class EnviarCorreoUseCase {
  constructor(
    private readonly bandeja: BandejaDeSalida,
    private readonly reparto: RepartoDeCorreos,
  ) {}

  async ejecutar(correo: Correo): Promise<void> {
    await this.bandeja.encolar(correo);
    void this.reparto.disparar();
  }
}
