import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { io, type Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { origenCliente } from '../src/common/cors';
import { configurarApp } from '../src/configurar-app';
import { TurnosGateway } from '../src/modules/tiempo-real/turnos.gateway';

const ESPERA_MS = 3000;

describe('Tiempo real (e2e)', () => {
  let app: INestApplication;
  let url: string;
  const sockets: Socket[] = [];

  function crearCliente(origen: string) {
    const socket = io(url, {
      extraHeaders: { origin: origen },
      reconnection: false,
      forceNew: true,
    });
    sockets.push(socket);
    return socket;
  }

  function conectar(origen = origenCliente()) {
    const socket = crearCliente(origen);
    return new Promise<Socket>((resolve, reject) => {
      socket.once('connect', () => resolve(socket));
      socket.once('connect_error', reject);
    });
  }

  function esperarEvento(socket: Socket) {
    return new Promise<unknown>((resolve, reject) => {
      const limite = setTimeout(
        () => reject(new Error('No llegó turnos:actualizados')),
        ESPERA_MS,
      );
      socket.once('turnos:actualizados', (payload: unknown) => {
        clearTimeout(limite);
        resolve(payload);
      });
    });
  }

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    url = `http://localhost:${port}`;
  });

  afterAll(async () => {
    for (const socket of sockets) socket.disconnect();
    await app.close();
  });

  it('envía la fecha y la cancha que cambiaron', async () => {
    const socket = await conectar();
    const recibido = esperarEvento(socket);
    app.get(TurnosGateway).notificar('2030-01-14', 3);
    await expect(recibido).resolves.toEqual({
      fecha: '2030-01-14',
      canchaId: 3,
    });
  });

  it('envía null cuando el cambio aplica a todas', async () => {
    const socket = await conectar();
    const recibido = esperarEvento(socket);
    app.get(TurnosGateway).notificar(null, null);
    await expect(recibido).resolves.toEqual({ fecha: null, canchaId: null });
  });

  it('dos clientes reciben el mismo evento', async () => {
    const [uno, dos] = await Promise.all([conectar(), conectar()]);
    const recibidos = Promise.all([esperarEvento(uno), esperarEvento(dos)]);
    app.get(TurnosGateway).notificar('2030-01-15', 1);
    const esperado = { fecha: '2030-01-15', canchaId: 1 };
    await expect(recibidos).resolves.toEqual([esperado, esperado]);
  });

  it('rechaza la conexión desde otro origen', async () => {
    await expect(conectar('http://otro-origen.test')).rejects.toThrow();
  });
});
