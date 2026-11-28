import { Controller, Get, Query } from '@nestjs/common';
import { RequerirPermiso } from '../../../sesiones/api-sesiones';
import {
  type AgendaDelDia,
  ConsultarAgendaUseCase,
} from '../../aplicacion/consultar-agenda.use-case';
import { ConsultarAgendaDto } from './agenda.dto';

/** Los turnos reservados de un día, para recepción y administración. */
@Controller('agenda')
@RequerirPermiso('agenda:consultar')
export class AgendaController {
  constructor(private readonly consultar: ConsultarAgendaUseCase) {}

  @Get()
  delDia(@Query() consulta: ConsultarAgendaDto): Promise<AgendaDelDia> {
    return this.consultar.ejecutar(consulta);
  }
}
