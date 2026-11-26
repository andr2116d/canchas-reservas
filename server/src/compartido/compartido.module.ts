import { Global, Module } from '@nestjs/common';
import { CIFRADOR } from './aplicacion/cifrador.port';
import { RELOJ } from './aplicacion/reloj.port';
import { AesGcmCifradorAdapter } from './infraestructura/cifrado/aes-gcm-cifrador.adapter';
import {
  CONFIGURACION,
  type Configuracion,
  leerConfiguracion,
} from './infraestructura/configuracion/configuracion';
import { PrismaService } from './infraestructura/prisma/prisma.service';
import { SistemaRelojAdapter } from './infraestructura/reloj/sistema-reloj.adapter';

/** Servicios técnicos que usan todas las features: configuración, base, cifrado y reloj. */
@Global()
@Module({
  providers: [
    {
      provide: CONFIGURACION,
      useFactory: () => leerConfiguracion(process.env),
    },
    {
      provide: CIFRADOR,
      useFactory: (configuracion: Configuracion) =>
        new AesGcmCifradorAdapter(
          configuracion.claveCifrado,
          configuracion.claveHash,
        ),
      inject: [CONFIGURACION],
    },
    { provide: RELOJ, useClass: SistemaRelojAdapter },
    PrismaService,
  ],
  exports: [CONFIGURACION, CIFRADOR, RELOJ, PrismaService],
})
export class CompartidoModule {}
