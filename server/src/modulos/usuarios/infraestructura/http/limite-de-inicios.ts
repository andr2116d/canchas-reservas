import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import {
  RELOJ,
  type Reloj,
} from '../../../../compartido/aplicacion/reloj.port';

const VENTANA_DE_INTENTOS = 15 * 60 * 1000;
const FALLOS_POR_CORREO = 8;
// Por encima de este tamaño se descartan los registros vencidos, para acotar la memoria.
const REGISTROS_ANTES_DE_LIMPIAR = 10_000;

export const LIMITE_DE_INICIOS_POR_IP = {
  default: { limit: 20, ttl: VENTANA_DE_INTENTOS },
};

interface IntentosFallidos {
  fallos: number;
  ventanaHasta: number;
  bloqueadoHasta?: number;
}

/**
 * Límite de intentos fallidos por correo, sin importar la IP: 8 fallos en
 * 15 minutos bloquean ese correo por 15 minutos. Los ingresos correctos no
 * cuentan y reinician el contador. El correo se guarda como hash, nunca en claro.
 */
@Injectable()
export class LimiteDeInicios {
  private readonly intentos = new Map<string, IntentosFallidos>();

  constructor(
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  /** Segundos que faltan para poder intentar con este correo; 0 si puede intentar ya. */
  segundosDeEspera(correo: string): number {
    const registro = this.intentos.get(this.clave(correo));
    const ahora = this.reloj.ahora().getTime();
    if (!registro?.bloqueadoHasta || registro.bloqueadoHasta <= ahora) return 0;
    return Math.ceil((registro.bloqueadoHasta - ahora) / 1000);
  }

  registrarFallo(correo: string): void {
    const clave = this.clave(correo);
    const ahora = this.reloj.ahora().getTime();
    const anterior = this.intentos.get(clave);
    const vigente =
      anterior && anterior.ventanaHasta > ahora ? anterior : undefined;
    const registro: IntentosFallidos = vigente ?? {
      fallos: 0,
      ventanaHasta: ahora + VENTANA_DE_INTENTOS,
    };
    registro.fallos += 1;
    if (registro.fallos >= FALLOS_POR_CORREO) {
      registro.bloqueadoHasta = ahora + VENTANA_DE_INTENTOS;
    }
    this.intentos.set(clave, registro);
    this.descartarVencidos(ahora);
  }

  /** Un ingreso correcto deja el correo sin fallos acumulados. */
  reiniciar(correo: string): void {
    this.intentos.delete(this.clave(correo));
  }

  private clave(correo: string): string {
    return this.cifrador.hashParaBuscar(
      `inicio:${correo.trim().toLowerCase()}`,
    );
  }

  private descartarVencidos(ahora: number): void {
    if (this.intentos.size <= REGISTROS_ANTES_DE_LIMPIAR) return;
    for (const [clave, registro] of this.intentos) {
      const hasta = Math.max(
        registro.ventanaHasta,
        registro.bloqueadoHasta ?? 0,
      );
      if (hasta <= ahora) this.intentos.delete(clave);
    }
  }
}
