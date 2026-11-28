import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsDefined,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ReglaInvalidaError } from '../../../../compartido/dominio/dominio.error';
import { leerId, MAXIMO_ID } from '../../../../compartido/dominio/id';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { ReservarTurnoUseCase } from '../../aplicacion/reservar-turno.use-case';
import { ResumirReservaUseCase } from '../../aplicacion/resumir-reserva.use-case';
import { ResumenDeReservaDto, TurnoConMontosDto } from './reserva.dto';
import { CobroDeReservaDto } from './cobro-de-reserva.dto';

const CLIENTE = { message: 'Elige un cliente.' };

class ResumenDeRecepcionDto extends ResumenDeReservaDto {
  @IsString(CLIENTE)
  @Matches(/^\d{1,10}$/, CLIENTE)
  titularId: string;
}

class ReservarEnRecepcionDto extends TurnoConMontosDto {
  @IsInt(CLIENTE)
  @Min(1, CLIENTE)
  @Max(MAXIMO_ID, CLIENTE)
  titularId: number;

  @IsDefined({ message: 'Registra el adelanto para confirmar la reserva.' })
  @IsObject({ message: 'Revisa los datos del cobro.' })
  @ValidateNested()
  @Type(() => CobroDeReservaDto)
  cobro: CobroDeReservaDto;
}

@Controller('recepcion/reservas')
@RequerirPermiso('reservas:gestionar-en-recepcion')
export class ReservasDeRecepcionController {
  constructor(
    private readonly resumir: ResumirReservaUseCase,
    private readonly reservar: ReservarTurnoUseCase,
  ) {}

  @Get('resumen')
  resumen(
    @Query() { titularId, canchaId, fecha, desde }: ResumenDeRecepcionDto,
  ) {
    const id = leerId(canchaId);
    const titular = leerId(titularId);
    if (!id)
      throw new ReglaInvalidaError({ canchaId: 'Elige una cancha del mapa.' });
    if (!titular) throw new ReglaInvalidaError({ titularId: CLIENTE.message });
    return this.resumir.desdeRecepcion({ canchaId: id, fecha, desde }, titular);
  }

  @Post()
  registrar(
    @Body() datos: ReservarEnRecepcionDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ) {
    return this.reservar.desdeRecepcion(datos, sesion.usuarioId);
  }
}
