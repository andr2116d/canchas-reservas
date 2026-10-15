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
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { cuerpoError } from '../../common/errores';
import type { UsuarioSesion } from '../../common/sesion/usuario-sesion';
import {
  AdicionalesService,
  MENSAJE_NO_ENCONTRADO,
} from './adicionales.service';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { CrearAdicionalDto } from './dto/crear-adicional.dto';
import { EditarAdicionalDto } from './dto/editar-adicional.dto';
import { ListarAdicionalesDto } from './dto/listar-adicionales.dto';

const idAdicional = new ParseIntPipe({
  exceptionFactory: () =>
    new NotFoundException(cuerpoError(404, MENSAJE_NO_ENCONTRADO)),
});

@Controller('adicionales')
@Roles('ADMINISTRADOR')
export class AdicionalesController {
  constructor(private readonly adicionales: AdicionalesService) {}

  @Get()
  listar(@Query() filtro: ListarAdicionalesDto) {
    return this.adicionales.listar(filtro.activo);
  }

  @Post()
  crear(@Body() dto: CrearAdicionalDto, @UsuarioActual() admin: UsuarioSesion) {
    return this.adicionales.crear(dto, admin.id);
  }

  @Patch(':id')
  editar(
    @Param('id', idAdicional) id: number,
    @Body() dto: EditarAdicionalDto,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.adicionales.editar(id, dto, admin.id);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', idAdicional) id: number,
    @Body() dto: CambiarEstadoDto,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.adicionales.cambiarEstado(id, dto.activo, admin.id);
  }

  @Delete(':id')
  @HttpCode(204)
  eliminar(
    @Param('id', idAdicional) id: number,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    return this.adicionales.eliminar(id, admin.id);
  }
}
