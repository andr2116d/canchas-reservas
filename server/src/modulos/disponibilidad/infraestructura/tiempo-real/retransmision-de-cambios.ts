import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { AgrupadorDeAvisos } from '../../aplicacion/agrupador-de-avisos';
import {
  ESCUCHA_DE_CAMBIOS,
  type EscuchaDeCambios,
} from '../../aplicacion/escucha-de-cambios.port';
import { DisponibilidadGateway } from './disponibilidad.gateway';

const ESPERA_PARA_AGRUPAR_MS = 300;

/** Pasa a los navegadores, agrupados, los cambios que avisa la base. */
@Injectable()
export class RetransmisionDeCambios
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly agrupador: AgrupadorDeAvisos;

  constructor(
    @Inject(ESCUCHA_DE_CAMBIOS) private readonly escucha: EscuchaDeCambios,
    gateway: DisponibilidadGateway,
  ) {
    this.agrupador = new AgrupadorDeAvisos(ESPERA_PARA_AGRUPAR_MS, () =>
      gateway.avisarCambio(),
    );
  }

  onApplicationBootstrap(): Promise<void> {
    return this.escucha.escuchar(() => this.agrupador.recibir());
  }

  async onModuleDestroy(): Promise<void> {
    this.agrupador.detener();
    await this.escucha.dejarDeEscuchar();
  }
}
