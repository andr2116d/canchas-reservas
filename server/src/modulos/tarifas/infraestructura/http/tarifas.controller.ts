import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { ConsultarTarifasUseCase } from '../../aplicacion/consultar-tarifas.use-case';
import { DefinirTarifaUseCase } from '../../aplicacion/definir-tarifa.use-case';
import {
  type TurnosConsultados,
  TurnosDelDiaUseCase,
} from '../../aplicacion/turnos-del-dia.use-case';
import { DefinirTarifaDto, TurnosDelDiaDto } from './tarifas.dto';

/** Tarifas por tipo de cancha: las define el administrador; los turnos con su precio los ve cualquier sesión. */
@Controller('tarifas')
export class TarifasController {
  constructor(
    private readonly consultar: ConsultarTarifasUseCase,
    private readonly definir: DefinirTarifaUseCase,
    private readonly turnos: TurnosDelDiaUseCase,
  ) {}

  @Get()
  @RequerirPermiso('tarifas:gestionar')
  vigentes() {
    return this.consultar.ejecutar();
  }

  @Get('turnos')
  @RequerirPermiso('tarifas:calcular')
  turnosDelDia(
    @Query() { tipo, dia }: TurnosDelDiaDto,
  ): Promise<TurnosConsultados> {
    return this.turnos.ejecutar(tipo, dia);
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
