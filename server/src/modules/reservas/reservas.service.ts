import { BadRequestException, Injectable } from '@nestjs/common';
import { cuerpoError } from '../../common/errores';
import {
  fechaEnLima,
  instanteEnLima,
  sumarDias,
} from '../../common/fechas-lima';
import { Reloj } from '../../common/reloj/reloj';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TurnoReservaDto } from './dto/turno-reserva.dto';

export const DIAS_MAXIMOS_ANTICIPACION = 30;

export const MENSAJES_RESERVA = {
  jugadorInactivo: 'Solo un jugador activo puede reservar',
  turnoPasado: 'El turno ya pasó',
  fueraDeRango: `Solo puedes reservar desde hoy hasta dentro de ${DIAS_MAXIMOS_ANTICIPACION} días`,
  canchaNoEncontrada: 'No se encontró la cancha',
  canchaDesactivada: 'La cancha está desactivada',
  canchaEnMantenimiento: 'La cancha está en mantenimiento',
} as const;

type Cliente = Prisma.TransactionClient | PrismaService;

function rechazo(mensaje: string, campo?: string) {
  return new BadRequestException(
    cuerpoError(400, mensaje, campo ? { [campo]: mensaje } : {}),
  );
}

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reloj: Reloj,
  ) {}

  async validar(
    jugadorId: number,
    datos: TurnoReservaDto,
    ahora: Date,
    cliente: Cliente = this.prisma,
  ) {
    await this.validarJugador(jugadorId, cliente);
    const inicioEn = this.validarFecha(datos, ahora);
    const cancha = await this.validarCancha(datos.canchaId, cliente);
    return { cancha, inicioEn };
  }

  private async validarJugador(jugadorId: number, cliente: Cliente) {
    const jugador = await cliente.usuario.findUnique({
      where: { id: jugadorId },
      select: { rol: true, estado: true },
    });
    if (jugador?.rol !== 'JUGADOR' || jugador.estado !== 'ACTIVO') {
      throw rechazo(MENSAJES_RESERVA.jugadorInactivo);
    }
  }

  private validarFecha({ fecha, horaInicio }: TurnoReservaDto, ahora: Date) {
    const inicioEn = instanteEnLima(fecha, horaInicio);
    if (inicioEn <= ahora) {
      throw rechazo(MENSAJES_RESERVA.turnoPasado, 'horaInicio');
    }
    const limite = sumarDias(fechaEnLima(ahora), DIAS_MAXIMOS_ANTICIPACION);
    if (fecha > limite) {
      throw rechazo(MENSAJES_RESERVA.fueraDeRango, 'fecha');
    }
    return inicioEn;
  }

  private async validarCancha(canchaId: number, cliente: Cliente) {
    const cancha = await cliente.cancha.findUnique({
      where: { id: canchaId },
      select: {
        id: true,
        nombre: true,
        tamano: true,
        activa: true,
        estado: true,
      },
    });
    if (!cancha) {
      throw rechazo(MENSAJES_RESERVA.canchaNoEncontrada, 'canchaId');
    }
    if (!cancha.activa) {
      throw rechazo(MENSAJES_RESERVA.canchaDesactivada, 'canchaId');
    }
    if (cancha.estado !== 'OPERATIVA') {
      throw rechazo(MENSAJES_RESERVA.canchaEnMantenimiento, 'canchaId');
    }
    return { id: cancha.id, nombre: cancha.nombre, tamano: cancha.tamano };
  }
}
