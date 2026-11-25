import {
  type OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { RUTA_DEL_TIEMPO_REAL } from '../../../../compartido/infraestructura/tiempo-real/ruta-del-tiempo-real';
import {
  leerTokenDeCabecera,
  ValidarSesionUseCase,
} from '../../../sesiones/api-sesiones';

const salaDe = (usuarioId: number) => `persona-${usuarioId}`;

/**
 * Canal de solo lectura con sesión: cada persona entra a su propia sala y recibe «avisos» cuando
 * tiene uno nuevo, sin datos; el navegador vuelve a pedirlos. Sin sesión válida se desconecta.
 */
@WebSocketGateway({
  namespace: 'avisos',
  path: RUTA_DEL_TIEMPO_REAL,
  serveClient: false,
  addTrailingSlash: false,
  maxHttpBufferSize: 1024,
  cors: { origin: false },
})
export class AvisosGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly personas?: Namespace;

  constructor(private readonly validarSesion: ValidarSesionUseCase) {}

  async handleConnection(socket: Socket): Promise<void> {
    const token = leerTokenDeCabecera(socket.handshake.headers.cookie);
    const sesion = await this.validarSesion.ejecutar(token, () => false);
    if (!sesion) {
      socket.disconnect(true);
      return;
    }
    await socket.join(salaDe(sesion.usuarioId));
  }

  avisarA(usuarioId: number): void {
    this.personas?.to(salaDe(usuarioId)).emit('avisos');
  }

  /** Tras una reconexión con la base: todos vuelven a pedir sus avisos por si se perdió alguno. */
  avisarATodos(): void {
    this.personas?.emit('avisos');
  }
}
