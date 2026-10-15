import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { cuerpoError } from '../../common/errores';
import type { UsuarioSesion } from '../../common/sesion/usuario-sesion';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { CrearRecepcionistaDto } from './dto/crear-recepcionista.dto';
import { EditarRecepcionistaDto } from './dto/editar-recepcionista.dto';
import { ListarRecepcionistasDto } from './dto/listar-recepcionistas.dto';
import { RestablecerContrasenaDto } from './dto/restablecer-contrasena.dto';
import { MENSAJE_NO_ENCONTRADO, UsuariosService } from './usuarios.service';

const idRecepcionista = new ParseIntPipe({
  exceptionFactory: () =>
    new NotFoundException(cuerpoError(404, MENSAJE_NO_ENCONTRADO)),
});

@Controller('recepcionistas')
@Roles('ADMINISTRADOR')
export class RecepcionistasController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar(@Query() filtro: ListarRecepcionistasDto) {
    return this.usuarios.listar(filtro.estado);
  }

  @Post()
  crear(
    @Body() dto: CrearRecepcionistaDto,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.usuarios.crear(dto, admin.id);
  }

  @Patch(':id')
  editar(
    @Param('id', idRecepcionista) id: number,
    @Body() dto: EditarRecepcionistaDto,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.usuarios.editar(id, dto, admin.id);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', idRecepcionista) id: number,
    @Body() dto: CambiarEstadoDto,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.usuarios.cambiarEstado(id, dto.estado, admin.id);
  }

  @Post(':id/restablecer-contrasena')
  @HttpCode(204)
  restablecerContrasena(
    @Param('id', idRecepcionista) id: number,
    @Body() dto: RestablecerContrasenaDto,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.usuarios.restablecerContrasena(id, dto.contrasena, admin.id);
  }
}
