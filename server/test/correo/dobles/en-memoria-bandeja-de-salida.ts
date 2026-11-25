import type { Reloj } from '../../../src/compartido/aplicacion/reloj.port';
import {
  type BandejaDeSalida,
  MINUTOS_DE_RESERVA,
} from '../../../src/modulos/correo/aplicacion/bandeja-de-salida.port';
import type {
  Correo,
  CorreoEnCola,
} from '../../../src/modulos/correo/dominio/correo';

interface Fila extends CorreoEnCola {
  estado: 'PENDIENTE' | 'ENVIADO' | 'FALLIDO';
  proximoIntentoEn: Date;
  enviadoEn?: Date;
  ultimoError?: string;
}

/** Bandeja de salida en memoria con las mismas reglas de reserva que la de la base. */
export class EnMemoriaBandejaDeSalida implements BandejaDeSalida {
  private readonly filas: Fila[] = [];

  constructor(private readonly reloj: Reloj) {}

  get correos(): Correo[] {
    return this.filas.map(({ para, asunto, texto, html }) => ({
      para,
      asunto,
      texto,
      html,
    }));
  }

  encolar(correo: Correo): Promise<void> {
    this.filas.push({
      ...correo,
      id: this.filas.length + 1,
      intentos: 0,
      estado: 'PENDIENTE',
      proximoIntentoEn: this.reloj.ahora(),
    });
    return Promise.resolve();
  }

  tomarPendientes(ahora: Date, cantidad: number): Promise<CorreoEnCola[]> {
    const tomados = this.filas
      .filter((f) => f.estado === 'PENDIENTE' && f.proximoIntentoEn <= ahora)
      .slice(0, cantidad);
    for (const fila of tomados) {
      fila.intentos++;
      fila.proximoIntentoEn = new Date(
        ahora.getTime() + MINUTOS_DE_RESERVA * 60_000,
      );
    }
    return Promise.resolve(
      tomados.map(({ id, intentos, para, asunto, texto, html }) => ({
        id,
        intentos,
        para,
        asunto,
        texto,
        html,
      })),
    );
  }

  marcarEnviado(id: number, enviadoEn: Date): Promise<void> {
    Object.assign(this.fila(id), { estado: 'ENVIADO', enviadoEn });
    return Promise.resolve();
  }

  reprogramar(
    id: number,
    proximoIntentoEn: Date,
    error: string,
  ): Promise<void> {
    Object.assign(this.fila(id), { proximoIntentoEn, ultimoError: error });
    return Promise.resolve();
  }

  marcarFallido(id: number, error: string): Promise<void> {
    Object.assign(this.fila(id), { estado: 'FALLIDO', ultimoError: error });
    return Promise.resolve();
  }

  estadoDe(id: number) {
    const { estado, intentos, enviadoEn, ultimoError } = this.fila(id);
    if (estado === 'ENVIADO') return { estado, intentos, enviadoEn };
    if (estado === 'FALLIDO') return { estado, intentos, ultimoError };
    return { estado, intentos };
  }

  ultimoErrorDe(id: number): string | undefined {
    return this.fila(id).ultimoError;
  }

  private fila(id: number): Fila {
    const fila = this.filas.find((f) => f.id === id);
    if (!fila) throw new Error(`No hay correo ${id}.`);
    return fila;
  }
}
