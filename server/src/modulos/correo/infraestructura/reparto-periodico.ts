import {
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { RepartoDeCorreos } from '../aplicacion/reparto-de-correos';

const SEGUNDOS_ENTRE_VUELTAS = 60;

/** Pasa por la bandeja al arrancar y cada minuto, para enviar los reintentos que ya tocan. */
@Injectable()
export class RepartoPeriodicoDeCorreos
  implements OnApplicationBootstrap, OnApplicationShutdown
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

  onApplicationShutdown(): void {
    clearInterval(this.temporizador);
  }
}
