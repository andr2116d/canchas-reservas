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
