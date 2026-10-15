import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { cuerpoError } from '../../common/errores';
import type { UsuarioSesion } from '../../common/sesion/usuario-sesion';
import { CanchasService, MENSAJE_NO_ENCONTRADA } from './canchas.service';
import { CambiarActivaDto } from './dto/cambiar-activa.dto';
import { CrearCanchaDto } from './dto/crear-cancha.dto';
import { EditarCanchaDto } from './dto/editar-cancha.dto';

const idCancha = new ParseIntPipe({
  exceptionFactory: () =>
    new NotFoundException(cuerpoError(404, MENSAJE_NO_ENCONTRADA)),
});

@Controller('canchas')
export class CanchasController {
  constructor(private readonly canchas: CanchasService) {}

  @Get()
  listar(@UsuarioActual() usuario: UsuarioSesion) {
    return this.canchas.listar(usuario.rol);
  }

  @Post()
  @Roles('ADMINISTRADOR')
  crear(@Body() dto: CrearCanchaDto, @UsuarioActual() admin: UsuarioSesion) {
    return this.canchas.crear(dto, admin.id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR')
  editar(
    @Param('id', idCancha) id: number,
    @Body() dto: EditarCanchaDto,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.canchas.editar(id, dto, admin.id);
  }

  @Patch(':id/activa')
  @Roles('ADMINISTRADOR')
  cambiarActiva(
    @Param('id', idCancha) id: number,
    @Body() dto: CambiarActivaDto,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.canchas.cambiarActiva(id, dto, admin.id);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @HttpCode(204)
  eliminar(
    @Param('id', idCancha) id: number,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.canchas.eliminar(id, admin.id);
  }
}
