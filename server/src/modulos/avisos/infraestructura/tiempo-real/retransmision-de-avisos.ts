import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import type { EscuchaDeCanal } from '../../../../compartido/infraestructura/tiempo-real/postgres-escucha';
import { AvisosGateway } from './avisos.gateway';

export const ESCUCHA_DE_AVISOS = Symbol('ESCUCHA_DE_AVISOS');

/** Lleva a cada persona los avisos que anuncia la base, con el id de su destinatario. */
@Injectable()
export class RetransmisionDeAvisos
  implements OnApplicationBootstrap, OnModuleDestroy
{
  constructor(
    @Inject(ESCUCHA_DE_AVISOS) private readonly escucha: EscuchaDeCanal,
    private readonly gateway: AvisosGateway,
  ) {}

  onApplicationBootstrap(): Promise<void> {
    return this.escucha.escuchar((contenido) => {
      const usuarioId = Number(contenido);
      if (Number.isInteger(usuarioId) && usuarioId > 0)
        this.gateway.avisarA(usuarioId);
      else this.gateway.avisarATodos();
    });
  }

  onModuleDestroy(): Promise<void> {
    return this.escucha.dejarDeEscuchar();
  }
}
