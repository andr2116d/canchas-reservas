import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';
import {
  CONFIGURACION,
  type Configuracion,
} from '../configuracion/configuracion';

/** Cliente de Prisma conectado a PostgreSQL durante la vida de la app. */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(@Inject(CONFIGURACION) configuracion: Configuracion) {
    super({
      adapter: new PrismaPg({ connectionString: configuracion.urlBaseDeDatos }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
