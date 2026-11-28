import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../../compartido/aplicacion/reloj.port';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import {
  leerMinutos,
  type VentanaDeLlegada,
  VENTANA_INICIAL,
} from '../dominio/ventana-de-llegada';

export const VENTANAS_DE_LLEGADA = Symbol('VENTANAS_DE_LLEGADA');

export interface VersionDeVentana extends VentanaDeLlegada {
  guardadaEn: Date;
  guardadaPor: string;
}

export interface VentanasDeLlegada {
  historial(): Promise<VersionDeVentana[]>;
  guardar(
    ventana: VentanaDeLlegada,
    guardadoPorId: number,
    guardadoEn: Date,
  ): Promise<boolean>;
}

@Injectable()
export class VentanaDeLlegadaUseCase {
  constructor(
    @Inject(VENTANAS_DE_LLEGADA) private readonly versiones: VentanasDeLlegada,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  async consultar() {
    const historial = await this.versiones.historial();
    return {
      inicial: VENTANA_INICIAL,
      vigente: historial[0] ?? null,
      historial,
    };
  }

  async definir(datos: VentanaDeLlegada, autorId: number) {
    const ventana = validarCampos({
      minutosAntes: () => leerMinutos(datos.minutosAntes),
      minutosDespues: () => leerMinutos(datos.minutosDespues),
    });
    const cambio = await this.versiones.guardar(
      ventana,
      autorId,
      this.reloj.ahora(),
    );
    return { cambio, ...(await this.consultar()) };
  }
}
