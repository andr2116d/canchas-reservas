import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { NoEncontradoError } from '../../../../compartido/dominio/dominio.error';
import { idDeRuta } from '../../../../compartido/infraestructura/http/id-de-ruta.pipe';
import {
  RequerirPermiso,
  type SesionValida,
  SesionDeLaSolicitud,
} from '../../../sesiones/api-sesiones';
import { MisAvisosUseCase } from '../../aplicacion/mis-avisos.use-case';

const ID_DE_AVISO = idDeRuta(
  () => new NoEncontradoError('No encontramos ese aviso.'),
);

/** La campana de cada persona, para los tres roles. */
@Controller('avisos')
@RequerirPermiso('cuenta:propia')
export class AvisosController {
  constructor(private readonly misAvisos: MisAvisosUseCase) {}

  @Get()
  consultar(@SesionDeLaSolicitud() sesion: SesionValida) {
    return this.misAvisos.consultar(sesion.usuarioId);
  }

  @Post('lectura')
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarTodos(@SesionDeLaSolicitud() sesion: SesionValida): Promise<void> {
    return this.misAvisos.marcarTodosLeidos(sesion.usuarioId);
  }

  @Post(':id/lectura')
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarUno(
    @SesionDeLaSolicitud() sesion: SesionValida,
    @Param('id', ID_DE_AVISO) avisoId: number,
  ): Promise<void> {
    return this.misAvisos.marcarLeido(sesion.usuarioId, avisoId);
  }
}
