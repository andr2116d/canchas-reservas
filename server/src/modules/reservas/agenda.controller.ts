import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { cuerpoError } from '../../common/errores';
import type { UsuarioSesion } from '../../common/sesion/usuario-sesion';
import { AgendaService } from './agenda.service';
import { ConfirmarPagoDto } from './dto/confirmar-pago.dto';
import { ConsultarAgendaDto } from './dto/consultar-agenda.dto';
import { MENSAJES_PAGO, PagosReservaService } from './pagos-reserva.service';

const idReserva = new ParseIntPipe({
  exceptionFactory: () =>
    new NotFoundException(cuerpoError(404, MENSAJES_PAGO.noEncontrada)),
});

@Controller('agenda')
@Roles('RECEPCIONISTA', 'ADMINISTRADOR')
export class AgendaController {
  constructor(
    private readonly agenda: AgendaService,
    private readonly pagos: PagosReservaService,
  ) {}

  @Get()
  consultar(@Query() dto: ConsultarAgendaDto) {
    return this.agenda.consultar(dto);
  }

  @Post(':id/confirmar-pago')
  confirmarPago(
    @Param('id', idReserva) id: number,
    @Body() dto: ConfirmarPagoDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ) {
    return this.pagos.confirmar(id, dto, usuario.id);
  }
}
