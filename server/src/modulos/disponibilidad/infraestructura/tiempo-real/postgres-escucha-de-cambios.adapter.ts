import { Inject, Injectable, Logger } from '@nestjs/common';
import { Client } from 'pg';
import {
  CONFIGURACION,
  type Configuracion,
} from '../../../../compartido/infraestructura/configuracion/configuracion';
import type { EscuchaDeCambios } from '../../aplicacion/escucha-de-cambios.port';

const CANAL = 'disponibilidad';
const ESPERA_PARA_RECONECTAR_MS = 2000;

/**
 * Escucha el canal que avisan los disparadores de la base (LISTEN/NOTIFY). Si la
 * conexión se cae, vuelve a conectarse y avisa, por si algo cambió mientras tanto.
 */
@Injectable()
export class PostgresEscuchaDeCambiosAdapter implements EscuchaDeCambios {
  private readonly registro = new Logger('EscuchaDeCambios');
  private cliente?: Client;
  private reintento?: ReturnType<typeof setTimeout>;
  private detenida = false;
  private alCambiar: () => void = () => undefined;

  constructor(
    @Inject(CONFIGURACION) private readonly configuracion: Configuracion,
  ) {}

  async escuchar(alCambiar: () => void): Promise<void> {
    this.alCambiar = alCambiar;
    await this.conectar();
  }

  async dejarDeEscuchar(): Promise<void> {
    this.detenida = true;
    clearTimeout(this.reintento);
    await this.cliente?.end().catch(() => undefined);
  }

  private async conectar(): Promise<void> {
    const cliente = new Client({
      connectionString: this.configuracion.urlBaseDeDatos,
    });
    cliente.on('notification', () => this.alCambiar());
    cliente.on('error', () => this.reconectar(cliente));
    try {
      await cliente.connect();
      await cliente.query(`LISTEN ${CANAL}`);
      this.cliente = cliente;
    } catch {
      this.reconectar(cliente);
    }
  }

  private reconectar(cliente: Client): void {
    void cliente.end().catch(() => undefined);
    if (this.detenida || this.reintento) return;
    this.registro.warn('Se perdió la escucha de cambios; se reintenta.');
    this.reintento = setTimeout(() => {
      this.reintento = undefined;
      void this.conectar().then(() => this.alCambiar());
    }, ESPERA_PARA_RECONECTAR_MS);
  }
}
