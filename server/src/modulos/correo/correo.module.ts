import { Logger, Module } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import {
  BANDEJA_DE_SALIDA,
  type BandejaDeSalida,
} from './aplicacion/bandeja-de-salida.port';
import {
  ENVIADOR_DE_CORREO,
  type EnviadorDeCorreo,
} from './aplicacion/enviador-de-correo.port';
import { EnviarCorreoUseCase } from './aplicacion/enviar-correo.use-case';
import { RepartoDeCorreos } from './aplicacion/reparto-de-correos';
import { RepartirCorreosUseCase } from './aplicacion/repartir-correos.use-case';
import { PrismaBandejaDeSalidaAdapter } from './infraestructura/persistencia/prisma-bandeja-de-salida.adapter';
import { RepartoPeriodicoDeCorreos } from './infraestructura/reparto-periodico';
import { leerConfiguracionDeCorreo } from './infraestructura/smtp/configuracion-de-correo';
import { SmtpEnviadorDeCorreoAdapter } from './infraestructura/smtp/smtp-enviador-de-correo.adapter';

const registro = new Logger('Correo');

/** Correos del servicio: se guardan en la bandeja de salida y se envían por SMTP con reintentos. */
@Module({
  providers: [
    {
      provide: ENVIADOR_DE_CORREO,
      useFactory: () =>
        new SmtpEnviadorDeCorreoAdapter(leerConfiguracionDeCorreo(process.env)),
    },
    { provide: BANDEJA_DE_SALIDA, useClass: PrismaBandejaDeSalidaAdapter },
    {
      provide: RepartirCorreosUseCase,
      useFactory: (b: BandejaDeSalida, e: EnviadorDeCorreo, reloj: Reloj) =>
        new RepartirCorreosUseCase(b, e, reloj),
      inject: [BANDEJA_DE_SALIDA, ENVIADOR_DE_CORREO, RELOJ],
    },
    {
      provide: RepartoDeCorreos,
      useFactory: (repartir: RepartirCorreosUseCase) =>
        new RepartoDeCorreos(repartir, (error) =>
          registro.error('No se pudo repartir los correos pendientes.', error),
        ),
      inject: [RepartirCorreosUseCase],
    },
    {
      provide: EnviarCorreoUseCase,
      useFactory: (b: BandejaDeSalida, reparto: RepartoDeCorreos) =>
        new EnviarCorreoUseCase(b, reparto),
      inject: [BANDEJA_DE_SALIDA, RepartoDeCorreos],
    },
    RepartoPeriodicoDeCorreos,
  ],
  exports: [EnviarCorreoUseCase],
})
export class CorreoModule {}
