import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { RequerirPermiso } from '../../../sesiones/api-sesiones';
import {
  RegistrarPersonalUseCase,
  type DatosDelPersonal,
} from '../../aplicacion/registrar-personal.use-case';

const COMO_TEXTO = { message: 'Ingresa este dato como texto.' };

export class RegistrarRecepcionistaDto implements DatosDelPersonal {
  @IsString(COMO_TEXTO)
  @Length(1, 100, { message: 'Ingresa los nombres.' })
  nombres: string;

  @IsString(COMO_TEXTO)
  @Length(1, 100, { message: 'Ingresa los apellidos.' })
  apellidos: string;

  @IsString(COMO_TEXTO)
  @Length(1, 254, { message: 'Ingresa un correo válido.' })
  correo: string;

  @IsString(COMO_TEXTO)
  @Length(1, 64, { message: 'Ingresa una contraseña temporal válida.' })
  contrasena: string;
}

@Controller('recepcionistas')
export class RecepcionistasController {
  constructor(private readonly registrarPersonal: RegistrarPersonalUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequerirPermiso('personal:crear-recepcionista')
  async registrar(@Body() datos: RegistrarRecepcionistaDto): Promise<void> {
    await this.registrarPersonal.ejecutar(datos, 'RECEPCIONISTA');
  }
}
