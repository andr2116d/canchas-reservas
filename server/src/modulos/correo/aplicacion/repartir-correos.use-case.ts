import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { CorreoEnCola } from '../dominio/correo';
import { proximoIntento } from '../dominio/reintentos';
import type { BandejaDeSalida } from './bandeja-de-salida.port';
import type { EnviadorDeCorreo } from './enviador-de-correo.port';

const CORREOS_POR_VUELTA = 20;
const LARGO_MAXIMO_DEL_ERROR = 500;

// Los servidores SMTP suelen repetir la dirección en el error; se borra antes de guardarlo.
const DIRECCION_DE_CORREO = /[^\s<>@"']+@[^\s<>@"']+/g;

function describir(error: unknown): string {
  const mensaje = error instanceof Error ? error.message : String(error);
  return mensaje
    .replace(DIRECCION_DE_CORREO, '[correo]')
    .slice(0, LARGO_MAXIMO_DEL_ERROR);
}

/** Envía los correos que toca y reintenta más tarde los que fallan, hasta un máximo de intentos. */
export class RepartirCorreosUseCase {
  constructor(
    private readonly bandeja: BandejaDeSalida,
    private readonly enviador: EnviadorDeCorreo,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(): Promise<void> {
    const correos = await this.bandeja.tomarPendientes(
      this.reloj.ahora(),
      CORREOS_POR_VUELTA,
    );
    for (const correo of correos) await this.enviar(correo);
  }

  private async enviar(correo: CorreoEnCola): Promise<void> {
    try {
      await this.enviador.enviar(correo);
      await this.bandeja.marcarEnviado(correo.id, this.reloj.ahora());
    } catch (error) {
      const siguiente = proximoIntento(correo.intentos, this.reloj.ahora());
      if (siguiente) {
        await this.bandeja.reprogramar(correo.id, siguiente, describir(error));
      } else {
        await this.bandeja.marcarFallido(correo.id, describir(error));
      }
    }
  }
}
