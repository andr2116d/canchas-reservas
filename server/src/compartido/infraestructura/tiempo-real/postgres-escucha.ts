import { Logger } from '@nestjs/common';
import { Client } from 'pg';

const ESPERA_PARA_RECONECTAR_MS = 2000;

/** Escucha un canal de PostgreSQL; recibe el contenido de cada aviso. */
export interface EscuchaDeCanal {
  escuchar(alAvisar: (contenido: string) => void): Promise<void>;
  dejarDeEscuchar(): Promise<void>;
}

/**
 * Escucha un canal que avisan los disparadores de la base (LISTEN/NOTIFY). Si la conexión se
 * cae, vuelve a conectarse y avisa con contenido vacío, por si algo cambió mientras tanto.
 */
export class PostgresEscucha implements EscuchaDeCanal {
  private readonly registro = new Logger('EscuchaDePostgres');
  private cliente?: Client;
  private reintento?: ReturnType<typeof setTimeout>;
  private detenida = false;
  private alAvisar: (contenido: string) => void = () => undefined;

  /** @param canal nombre fijo del canal, escrito en el código (nunca un dato de la persona). */
  constructor(
    private readonly urlBaseDeDatos: string,
    private readonly canal: string,
  ) {}

  async escuchar(alAvisar: (contenido: string) => void): Promise<void> {
    this.alAvisar = alAvisar;
    await this.conectar();
  }

  async dejarDeEscuchar(): Promise<void> {
    this.detenida = true;
    clearTimeout(this.reintento);
    await this.cliente?.end().catch(() => undefined);
  }

  private async conectar(): Promise<void> {
    const cliente = new Client({ connectionString: this.urlBaseDeDatos });
    cliente.on('notification', (aviso) => this.alAvisar(aviso.payload ?? ''));
    cliente.on('error', () => this.reconectar(cliente));
    try {
      await cliente.connect();
      await cliente.query(`LISTEN ${this.canal}`);
      this.cliente = cliente;
    } catch {
      this.reconectar(cliente);
    }
  }

  private reconectar(cliente: Client): void {
    void cliente.end().catch(() => undefined);
    if (this.detenida || this.reintento) return;
    this.registro.warn(
      `Se perdió la escucha del canal ${this.canal}; se reintenta.`,
    );
    this.reintento = setTimeout(() => {
      this.reintento = undefined;
      void this.conectar().then(() => this.alAvisar(''));
    }, ESPERA_PARA_RECONECTAR_MS);
  }
}
