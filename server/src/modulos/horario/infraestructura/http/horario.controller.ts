import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { ConsultarHorarioUseCase } from '../../aplicacion/consultar-horario.use-case';
import { DefinirHorarioUseCase } from '../../aplicacion/definir-horario.use-case';
import { DefinirHorarioDto } from './horario.dto';

/** Horario de atención del local: solo administración lo consulta y lo define. */
@Controller('horario')
export class HorarioController {
  constructor(
    private readonly consultar: ConsultarHorarioUseCase,
    private readonly definir: DefinirHorarioUseCase,
  ) {}

  @Get()
  @RequerirPermiso('horario:gestionar')
  vigente() {
    return this.consultar.ejecutar();
  }

  @Put()
  @RequerirPermiso('horario:gestionar')
  guardar(
    @Body() datos: DefinirHorarioDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ) {
    return this.definir.ejecutar(datos, sesion.usuarioId);
  }
}
