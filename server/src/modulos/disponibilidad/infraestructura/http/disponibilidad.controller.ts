import { Controller, Get, Query } from '@nestjs/common';
import { Publico } from '../../../sesiones/api-sesiones';
import {
  ConsultarDisponibilidadUseCase,
  type MapaDelDia,
} from '../../aplicacion/consultar-disponibilidad.use-case';
import { ConsultarDisponibilidadDto } from './disponibilidad.dto';

/** Mapa de turnos de un día: lo ve cualquiera, sin iniciar sesión. */
@Controller('disponibilidad')
export class DisponibilidadController {
  constructor(private readonly consultar: ConsultarDisponibilidadUseCase) {}

  @Get()
  @Publico()
  delDia(@Query() { fecha }: ConsultarDisponibilidadDto): Promise<MapaDelDia> {
    return this.consultar.ejecutar(fecha);
  }
}
