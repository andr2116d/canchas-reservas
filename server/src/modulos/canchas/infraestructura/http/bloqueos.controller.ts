import { idDeRuta } from '../../../../compartido/infraestructura/http/id-de-ruta.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import {
  BloquearCanchasUseCase,
  type ResultadoDelBloqueo,
} from '../../aplicacion/bloquear-canchas.use-case';
import { ConsultarBloqueosUseCase } from '../../aplicacion/consultar-bloqueos.use-case';
import { LiberarBloqueoUseCase } from '../../aplicacion/liberar-bloqueo.use-case';
import { QuitarBloqueoUseCase } from '../../aplicacion/quitar-bloqueo.use-case';
import type { VistaDeBloqueo } from '../../aplicacion/vista-de-bloqueo';
import { BloqueoNoEncontradoError } from '../../dominio/bloqueo-no-encontrado.error';
import { BloquearCanchasDto } from './bloqueo.dto';

/** Un id que no es número responde igual que uno que no existe. */
const ID_DE_BLOQUEO = idDeRuta(() => new BloqueoNoEncontradoError());

/** Bloqueos de canchas por mantenimiento. Solo administración. */
@Controller('bloqueos')
@RequerirPermiso('canchas:gestionar')
export class BloqueosController {
  constructor(
    private readonly consultar: ConsultarBloqueosUseCase,
    private readonly bloquear: BloquearCanchasUseCase,
    private readonly liberar: LiberarBloqueoUseCase,
    private readonly quitar: QuitarBloqueoUseCase,
  ) {}

  @Get()
  listar(): Promise<{
    sinTerminar: VistaDeBloqueo[];
    terminados: VistaDeBloqueo[];
  }> {
    return this.consultar.ejecutar();
  }

  @Post()
  crear(
    @Body() datos: BloquearCanchasDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<ResultadoDelBloqueo> {
    return this.bloquear.ejecutar(datos, sesion.usuarioId);
  }

  @Post(':id/liberacion')
  @HttpCode(HttpStatus.NO_CONTENT)
  liberarDesdeAhora(
    @Param('id', ID_DE_BLOQUEO) id: number,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.liberar.ejecutar(id, sesion.usuarioId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  retirar(
    @Param('id', ID_DE_BLOQUEO) id: number,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.quitar.ejecutar(id, sesion.usuarioId);
  }
}
