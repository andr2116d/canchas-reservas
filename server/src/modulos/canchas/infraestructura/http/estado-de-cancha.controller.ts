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
import { DesactivarCanchaUseCase } from '../../aplicacion/desactivar-cancha.use-case';
import { EliminarCanchaUseCase } from '../../aplicacion/eliminar-cancha.use-case';
import { ReactivarCanchaUseCase } from '../../aplicacion/reactivar-cancha.use-case';
import { ID_DE_CANCHA } from './id-de-cancha.pipe';

/** Desactivar, reactivar o eliminar una cancha. Solo administración. */
@Controller('canchas/:id')
@RequerirPermiso('canchas:gestionar')
export class EstadoDeCanchaController {
  constructor(
    private readonly desactivar: DesactivarCanchaUseCase,
    private readonly reactivar: ReactivarCanchaUseCase,
    private readonly eliminar: EliminarCanchaUseCase,
  ) {}

  @Post('desactivacion')
  @HttpCode(HttpStatus.NO_CONTENT)
  apagar(
    @Param('id', ID_DE_CANCHA) id: number,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.desactivar.ejecutar(id, sesion.usuarioId);
  }

  @Post('reactivacion')
  @HttpCode(HttpStatus.NO_CONTENT)
  encender(
    @Param('id', ID_DE_CANCHA) id: number,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.reactivar.ejecutar(id, sesion.usuarioId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  quitar(
    @Param('id', ID_DE_CANCHA) id: number,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.eliminar.ejecutar(id, sesion.usuarioId);
  }
}
