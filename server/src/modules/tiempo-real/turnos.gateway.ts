import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';

export const EVENTO_TURNOS_ACTUALIZADOS = 'turnos:actualizados';

// Sin sesión: el evento solo dice qué fecha y cancha cambiaron, no lleva datos privados.
@WebSocketGateway()
export class TurnosGateway {
  @WebSocketServer()
  private readonly server?: Server;

  private readonly logger = new Logger(TurnosGateway.name);

  notificar(fecha: string | null, canchaId: number | null) {
    if (!fechaValida(fecha) || !canchaIdValido(canchaId)) {
      this.logger.warn(
        `Notificación de turnos ignorada: fecha=${String(fecha)}, canchaId=${String(canchaId)}`,
      );
      return;
    }
    if (!this.server) return;
    try {
      this.server.emit(EVENTO_TURNOS_ACTUALIZADOS, { fecha, canchaId });
    } catch (error) {
      this.logger.warn(
        `No se pudo notificar el cambio de turnos: ${String(error)}`,
      );
    }
  }
}

function fechaValida(fecha: unknown) {
  if (fecha === null) return true;
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }
  const dia = new Date(`${fecha}T00:00:00.000Z`);
  return !Number.isNaN(dia.getTime()) && dia.toISOString().startsWith(fecha);
}

function canchaIdValido(canchaId: unknown) {
  return (
    canchaId === null || (Number.isInteger(canchaId) && Number(canchaId) > 0)
  );
}
