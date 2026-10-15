import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import type { UsuarioSesion } from '../../common/sesion/usuario-sesion';
import { CrearReservaDto } from './dto/crear-reserva.dto';
import { TurnoReservaDto } from './dto/turno-reserva.dto';
import { ReservasService } from './reservas.service';

@Controller('reservas')
@Roles('JUGADOR')
export class ReservasController {
  constructor(private readonly reservas: ReservasService) {}

  @Get('resumen')
  resumen(
    @Query() dto: TurnoReservaDto,
    @UsuarioActual() jugador: UsuarioSesion,
  ) {
    return this.reservas.resumen(jugador.id, dto);
  }

  @Get('mias')
  mias(@UsuarioActual() jugador: UsuarioSesion) {
    return this.reservas.mias(jugador.id);
  }

  @Post()
  crear(@Body() dto: CrearReservaDto, @UsuarioActual() jugador: UsuarioSesion) {
    return this.reservas.crear(jugador.id, dto);
  }
}
