import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { cuerpoError } from '../../common/errores';
import {
  MENSAJE_CANCHA_NO_ENCONTRADA,
  TarifasService,
} from './tarifas.service';

const idCancha = new ParseIntPipe({
  exceptionFactory: () =>
    new NotFoundException(cuerpoError(404, MENSAJE_CANCHA_NO_ENCONTRADA)),
});

@Controller('canchas/:id/tarifas')
export class TarifasController {
  constructor(private readonly tarifas: TarifasService) {}

  @Get()
  @Roles('ADMINISTRADOR')
  obtener(@Param('id', idCancha) id: number) {
    return this.tarifas.obtener(id);
  }
}
