import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import type { UsuarioSesion } from '../../common/sesion/usuario-sesion';
import { GuardarHorarioDto } from './dto/guardar-horario.dto';
import { VistaPreviaDto } from './dto/vista-previa.dto';
import { HorarioService } from './horario.service';

@Controller('horario')
export class HorarioController {
  constructor(private readonly horario: HorarioService) {}

  @Get()
  obtener() {
    return this.horario.obtener();
  }

  @Put()
  @Roles('ADMINISTRADOR')
  guardar(
    @Body() dto: GuardarHorarioDto,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.horario.guardar(dto, admin.id);
  }

  @Get('vista-previa')
  @Roles('ADMINISTRADOR')
  vistaPrevia(@Query() { fecha }: VistaPreviaDto) {
    return this.horario.vistaPrevia(fecha);
  }
}
