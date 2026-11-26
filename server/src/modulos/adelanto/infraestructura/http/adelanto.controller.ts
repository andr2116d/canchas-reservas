import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { ConsultarAdelantoUseCase } from '../../aplicacion/consultar-adelanto.use-case';
import { DefinirAdelantoUseCase } from '../../aplicacion/definir-adelanto.use-case';
import { DefinirAdelantoDto } from './adelanto.dto';

/** Adelanto mínimo del local: solo administración lo consulta y lo define. */
@Controller('adelanto')
export class AdelantoController {
  constructor(
    private readonly consultar: ConsultarAdelantoUseCase,
    private readonly definir: DefinirAdelantoUseCase,
  ) {}

  @Get()
  @RequerirPermiso('adelanto:gestionar')
  vigente() {
    return this.consultar.ejecutar();
  }

  @Put()
  @RequerirPermiso('adelanto:gestionar')
  guardar(
    @Body() datos: DefinirAdelantoDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ) {
    return this.definir.ejecutar(datos, sesion.usuarioId);
  }
}
