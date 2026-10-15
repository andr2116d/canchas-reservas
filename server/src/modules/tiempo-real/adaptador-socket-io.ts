import type { IncomingMessage } from 'node:http';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';
import { opcionesCors, origenCliente } from '../../common/cors';

// La CORS de Socket.IO solo agrega cabeceras; allowRequest rechaza en el server.
export function permitirConexion(
  req: Pick<IncomingMessage, 'headers'>,
  responder: (error: string | null, permitido: boolean) => void,
) {
  const permitido = req.headers.origin === origenCliente();
  responder(permitido ? null : 'Origen no permitido', permitido);
}

export class AdaptadorSocketIo extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): Server {
    return super.createIOServer(port, {
      ...options,
      cors: opcionesCors(),
      allowRequest: permitirConexion,
    } as ServerOptions);
  }
}
