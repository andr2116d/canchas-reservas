import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { TIPOS_DOCUMENTO } from '../../../../compartido/dominio/documento-identidad.value-object';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { ClientesDeRecepcionUseCase } from '../../aplicacion/clientes-de-recepcion.use-case';
import { COMO_TEXTO, DatosPersonalesDto } from './datos-personales.dto';

class BuscarClienteDto {
  @IsOptional()
  @IsIn(TIPOS_DOCUMENTO, { message: 'Elige el tipo de documento.' })
  tipoDocumento?: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  @MaxLength(12, { message: 'Revisa el número de documento.' })
  numeroDocumento?: string;

  @IsOptional()
  @IsString(COMO_TEXTO)
  @MaxLength(9, { message: 'El celular debe tener 9 dígitos.' })
  celular?: string;
}

class RegistrarClienteDto extends DatosPersonalesDto {
  @IsOptional()
  @IsString(COMO_TEXTO)
  correo?: string;

  @IsString({ message: 'Confirma que informaste el aviso de privacidad.' })
  versionDelAviso: string;
}

@Controller('recepcion/clientes')
@RequerirPermiso('reservas:gestionar-en-recepcion')
export class ClientesDeRecepcionController {
  constructor(private readonly clientes: ClientesDeRecepcionUseCase) {}

  @Post('buscar')
  @HttpCode(200)
  buscar(@Body() datos: BuscarClienteDto) {
    return this.clientes.buscar(datos);
  }

  @Post()
  registrar(
    @Body() datos: RegistrarClienteDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ) {
    return this.clientes.registrar(datos, sesion.usuarioId);
  }
}
