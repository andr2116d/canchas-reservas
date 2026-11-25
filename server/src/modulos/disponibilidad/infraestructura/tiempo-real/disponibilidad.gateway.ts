import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace } from 'socket.io';

/** Ruta de socket.io: bajo /api, para que pase por el mismo origen que la API. */
export const RUTA_DEL_TIEMPO_REAL = '/api/tiempo-real';

/**
 * Canal público de solo lectura: avisa a los navegadores que el mapa de turnos
 * cambió, sin datos. No acepta mensajes de los navegadores.
 */
@WebSocketGateway({
  namespace: 'disponibilidad',
  path: RUTA_DEL_TIEMPO_REAL,
  serveClient: false,
  addTrailingSlash: false,
  maxHttpBufferSize: 1024,
  cors: { origin: false },
})
export class DisponibilidadGateway {
  @WebSocketServer()
  private readonly navegadores?: Namespace;

  avisarCambio(): void {
    this.navegadores?.emit('cambio');
  }
}
