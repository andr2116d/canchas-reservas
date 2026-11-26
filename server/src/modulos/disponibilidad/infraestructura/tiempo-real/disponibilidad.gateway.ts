import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace } from 'socket.io';
import { RUTA_DEL_TIEMPO_REAL } from '../../../../compartido/infraestructura/tiempo-real/ruta-del-tiempo-real';

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
