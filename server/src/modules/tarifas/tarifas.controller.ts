import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { cuerpoError } from '../../common/errores';
import type { UsuarioSesion } from '../../common/sesion/usuario-sesion';
import { DefinirTarifaDto } from './dto/definir-tarifa.dto';
import {
  MENSAJE_CANCHA_NO_ENCONTRADA,
  TarifasService,
} from './tarifas.service';

const idCancha = new ParseIntPipe({
  exceptionFactory: () =>
    new NotFoundException(cuerpoError(404, MENSAJE_CANCHA_NO_ENCONTRADA)),
});

@Controller('canchas/:id/tarifas')
export class TarifasController {
  constructor(private readonly tarifas: TarifasService) {}

  @Get()
  @Roles('ADMINISTRADOR')
  obtener(@Param('id', idCancha) id: number) {
    return this.tarifas.obtener(id);
  }

  @Put()
  @Roles('ADMINISTRADOR')
  definir(
    @Param('id', idCancha) id: number,
    @Body() dto: DefinirTarifaDto,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.tarifas.definir(id, dto, admin.id);
  }
}
