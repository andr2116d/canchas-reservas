import { Controller, Get } from '@nestjs/common';
import type { SesionValida } from '../../aplicacion/validar-sesion.use-case';
import { RequerirPermiso } from './requerir-permiso.decorator';
import { SesionDeLaSolicitud } from './sesion-de-la-solicitud.decorator';

@Controller('paneles')
export class PanelesController {
  @Get('administracion')
  @RequerirPermiso('panel:administracion')
  consultarAdministracion(@SesionDeLaSolicitud() sesion: SesionValida) {
    return accesoAlPanel(sesion);
  }

  @Get('recepcion')
  @RequerirPermiso('panel:recepcion')
  consultarRecepcion(@SesionDeLaSolicitud() sesion: SesionValida) {
    return accesoAlPanel(sesion);
  }
}

function accesoAlPanel(sesion: SesionValida) {
  return { rol: sesion.rol, venceEn: sesion.venceEn };
}
