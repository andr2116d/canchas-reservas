import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReglaInvalidaError } from '../../../../compartido/dominio/dominio.error';
import { leerId } from '../../../../compartido/dominio/id';
import {
  RequerirPermiso,
  type SesionValida,
  SesionDeLaSolicitud,
} from '../../../sesiones/api-sesiones';
import {
  ConsultarMiReservaUseCase,
  type VistaDeMiReserva,
} from '../../aplicacion/consultar-mi-reserva.use-case';
import {
  type ReservaSeparada,
  ReservarTurnoUseCase,
} from '../../aplicacion/reservar-turno.use-case';
import {
  type ResumenDeReserva,
  ResumirReservaUseCase,
} from '../../aplicacion/resumir-reserva.use-case';
import { ResumenDeReservaDto, SepararTurnoDto } from './reserva.dto';

/** El jugador separa un turno del mapa y ve la reserva que separó. */
@Controller('reservas')
@RequerirPermiso('reservas:separar')
export class ReservasController {
  constructor(
    private readonly resumir: ResumirReservaUseCase,
    private readonly reservar: ReservarTurnoUseCase,
    private readonly consultar: ConsultarMiReservaUseCase,
  ) {}

  @Get('resumen')
  resumen(
    @Query() { canchaId, fecha, desde }: ResumenDeReservaDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<ResumenDeReserva> {
    const id = leerId(canchaId);
    if (id === 0)
      throw new ReglaInvalidaError({ canchaId: 'Elige una cancha del mapa.' });
    return this.resumir.ejecutar(
      { canchaId: id, fecha, desde },
      sesion.usuarioId,
    );
  }

  @Post()
  separar(
    @Body() pedido: SepararTurnoDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<ReservaSeparada> {
    const { canchaId, fecha, desde, precio, adelanto, adicionales } = pedido;
    return this.reservar.ejecutar({
      titularId: sesion.usuarioId,
      canchaId,
      fecha,
      desde,
      precio,
      adelanto,
      adicionales,
    });
  }

  @Get(':codigo')
  ver(
    @Param('codigo') codigo: string,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<VistaDeMiReserva> {
    return this.consultar.ejecutar(sesion.usuarioId, codigo);
  }
}
