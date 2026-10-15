import { Controller, Get, Query } from '@nestjs/common';
import { DisponibilidadService } from './disponibilidad.service';
import { ConsultarDisponibilidadDto } from './dto/consultar-disponibilidad.dto';

@Controller('disponibilidad')
export class DisponibilidadController {
  constructor(private readonly disponibilidad: DisponibilidadService) {}

  @Get()
  consultar(@Query() dto: ConsultarDisponibilidadDto) {
    return this.disponibilidad.consultar(dto);
  }
}
