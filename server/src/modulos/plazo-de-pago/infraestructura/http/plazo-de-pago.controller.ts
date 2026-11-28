import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { ConsultarPlazoDePagoUseCase } from '../../aplicacion/consultar-plazo-de-pago.use-case';
import { DefinirPlazoDePagoUseCase } from '../../aplicacion/definir-plazo-de-pago.use-case';
import { DefinirPlazoDePagoDto } from './plazo-de-pago.dto';

/** Plazo para pagar el adelanto: solo administración lo consulta y lo define. */
@Controller('plazo-de-pago')
@RequerirPermiso('plazo-de-pago:gestionar')
export class PlazoDePagoController {
  constructor(
    private readonly consultar: ConsultarPlazoDePagoUseCase,
    private readonly definir: DefinirPlazoDePagoUseCase,
  ) {}

  @Get()
  vigente() {
    return this.consultar.ejecutar();
  }

  @Put()
  guardar(
    @Body() datos: DefinirPlazoDePagoDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ) {
    return this.definir.ejecutar(datos, sesion.usuarioId);
  }
}
