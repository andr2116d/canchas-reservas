import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { AccesosService } from './accesos.service';
import { ConsultarAccesosDto } from './dto/consultar-accesos.dto';

@Controller('accesos')
@Roles('ADMINISTRADOR')
export class AccesosController {
  constructor(private readonly accesos: AccesosService) {}

  @Get()
  listar(@Query() filtros: ConsultarAccesosDto) {
    return this.accesos.listar(filtros);
  }
}
