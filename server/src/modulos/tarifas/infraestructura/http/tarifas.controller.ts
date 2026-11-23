import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import {
  CalcularValorDelTurnoUseCase,
  type ValorCalculado,
} from '../../aplicacion/calcular-valor-del-turno.use-case';
import { ConsultarTarifasUseCase } from '../../aplicacion/consultar-tarifas.use-case';
import { DefinirTarifaUseCase } from '../../aplicacion/definir-tarifa.use-case';
import { DefinirTarifaDto, ValorDelTurnoDto } from './tarifas.dto';

/** Tarifas por tipo de cancha: las define el administrador; el valor lo calcula cualquier sesión. */
@Controller('tarifas')
export class TarifasController {
  constructor(
    private readonly consultar: ConsultarTarifasUseCase,
    private readonly definir: DefinirTarifaUseCase,
    private readonly calcular: CalcularValorDelTurnoUseCase,
  ) {}

  @Get()
  @RequerirPermiso('tarifas:gestionar')
  vigentes() {
    return this.consultar.ejecutar();
  }

  @Get('valor-del-turno')
  @RequerirPermiso('tarifas:calcular')
  valorDelTurno(
    @Query() { tipo, inicio }: ValorDelTurnoDto,
  ): Promise<ValorCalculado> {
    return this.calcular.ejecutar(tipo, inicio);
  }

  @Put(':tipo')
  @RequerirPermiso('tarifas:gestionar')
  guardar(
    @Param('tipo') tipo: string,
    @Body() datos: DefinirTarifaDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ) {
    return this.definir.ejecutar(tipo, datos, sesion.usuarioId);
  }
}
