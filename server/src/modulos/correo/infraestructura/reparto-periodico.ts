import {
  Injectable,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { RepartoDeCorreos } from '../aplicacion/reparto-de-correos';

const SEGUNDOS_ENTRE_VUELTAS = 60;

/** Pasa por la bandeja al arrancar y cada minuto, para enviar los reintentos que ya tocan. */
@Injectable()
export class RepartoPeriodicoDeCorreos
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private temporizador?: NodeJS.Timeout;

  constructor(private readonly reparto: RepartoDeCorreos) {}

  onApplicationBootstrap(): void {
    void this.reparto.disparar();
    this.temporizador = setInterval(
      () => void this.reparto.disparar(),
      SEGUNDOS_ENTRE_VUELTAS * 1000,
    );
    this.temporizador.unref();
  }

  /** Antes de cerrar la base, espera el envío en curso para no cortarlo a la mitad. */
  async onModuleDestroy(): Promise<void> {
    clearInterval(this.temporizador);
    await this.reparto.detener();
  }
}
