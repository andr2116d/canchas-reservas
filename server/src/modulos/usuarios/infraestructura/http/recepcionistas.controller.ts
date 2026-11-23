import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ReglaInvalidaError } from '../../../../compartido/dominio/dominio.error';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { RegistrarRecepcionistaUseCase } from '../../aplicacion/registrar-recepcionista.use-case';
import { SugerirCorreoInstitucionalUseCase } from '../../aplicacion/sugerir-correo-institucional.use-case';
import { CorreoSugeridoDto } from './correo-sugerido.dto';
import { RegistrarRecepcionistaDto } from './registrar-recepcionista.dto';

/** Gestión de las cuentas de recepción. Solo para el administrador. */
@Controller('recepcionistas')
@RequerirPermiso('personal:gestionar-recepcionistas')
export class RecepcionistasController {
  constructor(
    private readonly registrar: RegistrarRecepcionistaUseCase,
    private readonly sugerirCorreo: SugerirCorreoInstitucionalUseCase,
  ) {}

  @Get('correo-sugerido')
  async sugerir(
    @Query() { nombres, apellidos }: CorreoSugeridoDto,
  ): Promise<{ usuarioDeCorreo: string }> {
    const sugerencia = await this.sugerirCorreo.ejecutar(nombres, apellidos);
    if (!sugerencia) {
      throw new ReglaInvalidaError({
        correo: 'Escribe los nombres y apellidos para generar el correo.',
      });
    }
    return sugerencia;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(
    @Body() datos: RegistrarRecepcionistaDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<{ id: number }> {
    return this.registrar.ejecutar(datos, sesion.usuarioId);
  }
}
