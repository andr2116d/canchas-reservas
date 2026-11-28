import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { CheckInDeReservaUseCase } from '../../aplicacion/check-in-de-reserva.use-case';
import { CobroDeReservaDto } from './cobro-de-reserva.dto';

@Controller('recepcion/reservas/:codigo/check-in')
@RequerirPermiso('reservas:hacer-check-in')
export class CheckInDeReservaController {
  constructor(private readonly checkIn: CheckInDeReservaUseCase) {}

  @Get()
  consultar(@Param('codigo') codigo: string) {
    return this.checkIn.consultar(codigo);
  }

  @Post()
  @HttpCode(200)
  registrar(
    @Param('codigo') codigo: string,
    @Body() datos: CobroDeReservaDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ) {
    return this.checkIn.ejecutar(codigo, sesion.usuarioId, datos);
  }
}
