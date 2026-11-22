import { Inject, Injectable } from '@nestjs/common';
import {
  InjectThrottlerStorage,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';

const VENTANA_DE_INTENTOS = 15 * 60 * 1000;
const INTENTOS_POR_CORREO = 8;
export const LIMITE_DE_INICIOS_POR_IP = {
  default: { limit: 20, ttl: VENTANA_DE_INTENTOS },
};

@Injectable()
export class LimiteDeInicios {
  constructor(
    @InjectThrottlerStorage() private readonly almacenamiento: ThrottlerStorage,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async segundosDeEspera(correo: string): Promise<number> {
    const clave = this.cifrador.hashParaBuscar(
      `inicio:${correo.trim().toLowerCase()}`,
    );
    const intento = await this.almacenamiento.increment(
      clave,
      VENTANA_DE_INTENTOS,
      INTENTOS_POR_CORREO,
      VENTANA_DE_INTENTOS,
      'inicios-por-correo',
    );
    return intento.isBlocked ? Math.max(1, intento.timeToBlockExpire) : 0;
  }
}
