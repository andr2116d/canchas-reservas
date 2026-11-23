import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { RegistrarRecepcionistaUseCase } from '../../aplicacion/registrar-recepcionista.use-case';
import { RegistrarRecepcionistaDto } from './registrar-recepcionista.dto';

/** Gestión de las cuentas de recepción. Solo para el administrador. */
@Controller('recepcionistas')
@RequerirPermiso('personal:gestionar-recepcionistas')
export class RecepcionistasController {
  constructor(private readonly registrar: RegistrarRecepcionistaUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(
    @Body() datos: RegistrarRecepcionistaDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<{ id: number }> {
    return this.registrar.ejecutar(datos, sesion.usuarioId);
  }
}
