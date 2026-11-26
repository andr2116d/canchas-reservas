import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type Cuenta,
  ConsultarCuentaUseCase,
} from '../../aplicacion/consultar-cuenta.use-case';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { CambiarMiTipoDeDocumentoUseCase } from '../../aplicacion/cambiar-mi-tipo-de-documento.use-case';
import { CompletarMisDatosUseCase } from '../../aplicacion/completar-mis-datos.use-case';
import { LIMITE_DE_INICIOS_POR_IP } from './limite-de-inicios';
import {
  CambiarMiTipoDeDocumentoDto,
  CompletarMisDatosDto,
} from './mi-cuenta.dto';

/** Datos que identifican a la persona: el primer ingreso del personal y el cambio único de documento. */
@Controller('cuenta')
export class DatosPropiosController {
  constructor(
    private readonly consultarCuenta: ConsultarCuentaUseCase,
    private readonly completarDatos: CompletarMisDatosUseCase,
    private readonly cambiarDocumento: CambiarMiTipoDeDocumentoUseCase,
  ) {}

  /** Lo que ya se sabe de la persona, para que lo confirme o lo complete. */
  @Get('datos')
  @RequerirPermiso('cuenta:completar-datos')
  async datosActuales(
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<Cuenta> {
    const cuenta = await this.consultarCuenta.ejecutar(sesion.usuarioId);
    if (!cuenta) throw new UnauthorizedException();
    return cuenta;
  }

  @Post('datos')
  @RequerirPermiso('cuenta:completar-datos')
  @Throttle(LIMITE_DE_INICIOS_POR_IP)
  @HttpCode(HttpStatus.NO_CONTENT)
  completar(
    @SesionDeLaSolicitud() sesion: SesionValida,
    @Body() datos: CompletarMisDatosDto,
  ): Promise<void> {
    return this.completarDatos.ejecutar(sesion.usuarioId, datos);
  }

  @Patch('documento')
  @RequerirPermiso('cuenta:propia')
  @Throttle(LIMITE_DE_INICIOS_POR_IP)
  @HttpCode(HttpStatus.NO_CONTENT)
  cambiarTipoDeDocumento(
    @SesionDeLaSolicitud() sesion: SesionValida,
    @Body() pedido: CambiarMiTipoDeDocumentoDto,
  ): Promise<void> {
    return this.cambiarDocumento.ejecutar(sesion.usuarioId, pedido);
  }
}
