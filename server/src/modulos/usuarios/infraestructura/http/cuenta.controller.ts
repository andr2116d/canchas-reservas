import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import {
  type Cuenta,
  ConsultarCuentaUseCase,
} from '../../aplicacion/consultar-cuenta.use-case';

/** Cuenta del usuario con sesión iniciada. */
@Controller('cuenta')
export class CuentaController {
  constructor(private readonly consultarCuenta: ConsultarCuentaUseCase) {}

  @Get()
  @RequerirPermiso('panel:jugador')
  async consultar(
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<Cuenta> {
    const cuenta = await this.consultarCuenta.ejecutar(sesion.usuarioId);
    if (!cuenta) throw new UnauthorizedException();
    return cuenta;
  }
}
