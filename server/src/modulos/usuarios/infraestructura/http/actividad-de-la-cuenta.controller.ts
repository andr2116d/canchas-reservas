import { Controller, Get } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { ConsultarMisAccesosUseCase } from '../../aplicacion/consultar-mis-accesos.use-case';

/** Los últimos inicios de sesión de la propia cuenta. */
@Controller('cuenta/accesos')
@RequerirPermiso('cuenta:propia')
export class ActividadDeLaCuentaController {
  constructor(private readonly misAccesos: ConsultarMisAccesosUseCase) {}

  @Get()
  listar(
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<{ ocurridoEn: string }[]> {
    return this.misAccesos.ejecutar(sesion.usuarioId);
  }
}
