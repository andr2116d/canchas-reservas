import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { ConsultarReglaDeCancelacionUseCase } from '../../aplicacion/consultar-regla-de-cancelacion.use-case';
import { DefinirReglaDeCancelacionUseCase } from '../../aplicacion/definir-regla-de-cancelacion.use-case';
import { SimularCancelacionUseCase } from '../../aplicacion/simular-cancelacion.use-case';
import {
  DefinirReglaDeCancelacionDto,
  SimularCancelacionDto,
} from './regla-de-cancelacion.dto';

/** Regla de cancelación del local: solo administración la consulta, la define y la simula. */
@Controller('cancelacion')
export class ReglaDeCancelacionController {
  constructor(
    private readonly consultar: ConsultarReglaDeCancelacionUseCase,
    private readonly definir: DefinirReglaDeCancelacionUseCase,
    private readonly simular: SimularCancelacionUseCase,
  ) {}

  @Get('regla')
  @RequerirPermiso('cancelacion:gestionar')
  vigente() {
    return this.consultar.ejecutar();
  }

  @Put('regla')
  @RequerirPermiso('cancelacion:gestionar')
  guardar(
    @Body() datos: DefinirReglaDeCancelacionDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ) {
    return this.definir.ejecutar(datos, sesion.usuarioId);
  }

  /** Vista previa: calcula sin guardar nada, con el mismo código que se aplicará al cancelar. */
  @Post('simulacion')
  @HttpCode(200)
  @RequerirPermiso('cancelacion:gestionar')
  simulacion(@Body() datos: SimularCancelacionDto) {
    return this.simular.ejecutar(datos);
  }
}
