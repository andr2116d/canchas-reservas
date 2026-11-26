import {
  Controller,
  Delete,
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
import { EliminarAdicionalUseCase } from '../../aplicacion/eliminar-adicional.use-case';
import {
  DesactivarAdicionalUseCase,
  ReactivarAdicionalUseCase,
} from '../../aplicacion/estado-de-adicional.use-case';
import { ID_DE_ADICIONAL } from './id-de-adicional.pipe';

/** Desactivar, reactivar o eliminar un adicional. Solo administración. */
@Controller('adicionales/:id')
@RequerirPermiso('adicionales:gestionar')
export class EstadoDeAdicionalController {
  constructor(
    private readonly desactivar: DesactivarAdicionalUseCase,
    private readonly reactivar: ReactivarAdicionalUseCase,
    private readonly eliminar: EliminarAdicionalUseCase,
  ) {}

  @Post('desactivacion')
  @HttpCode(HttpStatus.NO_CONTENT)
  apagar(
    @Param('id', ID_DE_ADICIONAL) id: number,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.desactivar.ejecutar(id, sesion.usuarioId);
  }

  @Post('reactivacion')
  @HttpCode(HttpStatus.NO_CONTENT)
  encender(
    @Param('id', ID_DE_ADICIONAL) id: number,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.reactivar.ejecutar(id, sesion.usuarioId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  quitar(
    @Param('id', ID_DE_ADICIONAL) id: number,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.eliminar.ejecutar(id, sesion.usuarioId);
  }
}
