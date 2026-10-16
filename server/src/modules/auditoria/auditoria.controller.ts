import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { ConsultaAuditoriaService } from './consulta-auditoria.service';
import { ConsultarAuditoriaDto } from './dto/consultar-auditoria.dto';

@Controller('auditoria')
@Roles('ADMINISTRADOR')
export class AuditoriaController {
  constructor(private readonly consulta: ConsultaAuditoriaService) {}

  @Get()
  listar(@Query() filtros: ConsultarAuditoriaDto) {
    return this.consulta.listar(filtros);
  }
}
