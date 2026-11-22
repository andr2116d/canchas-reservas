import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import type { SesionValida } from '../../../sesiones/aplicacion/validar-sesion.use-case';
import { SesionDeLaSolicitud } from '../../../sesiones/infraestructura/http/sesion-de-la-solicitud.decorator';
import {
  type Cuenta,
  ConsultarCuentaUseCase,
} from '../../aplicacion/consultar-cuenta.use-case';

/** Cuenta del usuario con sesión iniciada. */
@Controller('cuenta')
export class CuentaController {
  constructor(private readonly consultarCuenta: ConsultarCuentaUseCase) {}

  @Get()
  async consultar(
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<Cuenta> {
    const cuenta = await this.consultarCuenta.ejecutar(sesion.usuarioId);
    if (!cuenta) throw new UnauthorizedException();
    return cuenta;
  }
}
