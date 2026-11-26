import { Controller, Get, Query } from '@nestjs/common';
import { RequerirPermiso } from '../../../sesiones/api-sesiones';
import {
  ConsultarHistorialUseCase,
  type PaginaDelHistorial,
} from '../../aplicacion/consultar-historial.use-case';
import type { Autor } from '../../dominio/historial.repository';
import { FiltroDelHistorialDto } from './historial.dto';

/** Historial de cambios: solo administración lo consulta y nadie lo modifica. */
@Controller('historial')
@RequerirPermiso('historial:consultar')
export class HistorialController {
  constructor(private readonly consultar: ConsultarHistorialUseCase) {}

  @Get()
  listar(@Query() filtros: FiltroDelHistorialDto): Promise<PaginaDelHistorial> {
    return this.consultar.consultar(filtros);
  }

  @Get('autores')
  autores(): Promise<Autor[]> {
    return this.consultar.autores();
  }
}
