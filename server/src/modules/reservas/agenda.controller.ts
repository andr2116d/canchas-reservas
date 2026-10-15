import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { AgendaService } from './agenda.service';
import { ConsultarAgendaDto } from './dto/consultar-agenda.dto';

@Controller('agenda')
@Roles('RECEPCIONISTA', 'ADMINISTRADOR')
export class AgendaController {
  constructor(private readonly agenda: AgendaService) {}

  @Get()
  consultar(@Query() dto: ConsultarAgendaDto) {
    return this.agenda.consultar(dto);
  }
}
