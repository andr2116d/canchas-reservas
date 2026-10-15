import { Body, Controller, Get, Put } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import type { UsuarioSesion } from '../../common/sesion/usuario-sesion';
import { ActualizarReglaCancelacionDto } from './dto/actualizar-regla-cancelacion.dto';
import { ReglaCancelacionService } from './regla-cancelacion.service';

@Controller('regla-cancelacion')
export class ReglaCancelacionController {
  constructor(private readonly regla: ReglaCancelacionService) {}

  @Get()
  async obtener() {
    const { horasAnticipacion, tipoCompensacion } =
      await this.regla.obtenerVigente();
    return { horasAnticipacion, tipoCompensacion };
  }

  @Put()
  @Roles('ADMINISTRADOR')
  actualizar(
    @Body() dto: ActualizarReglaCancelacionDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ) {
    return this.regla.actualizar(dto, usuario.id);
  }
}
