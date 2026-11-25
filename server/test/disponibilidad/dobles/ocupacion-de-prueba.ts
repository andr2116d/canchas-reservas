import type {
  BloqueoDelDia,
  CanchaConsultada,
  OcupacionDelDia,
  ReservaDelDia,
} from '../../../src/modulos/disponibilidad/aplicacion/ocupacion-del-dia.port';

/** Canchas operativas, reservas y bloqueos que la prueba arma a mano. */
export class OcupacionDePrueba implements OcupacionDelDia {
  readonly canchas: CanchaConsultada[] = [];
  readonly reservas: ReservaDelDia[] = [];
  readonly bloqueos: BloqueoDelDia[] = [];

  canchasOperativas(): Promise<CanchaConsultada[]> {
    return Promise.resolve(this.canchas);
  }

  entre(
    inicio: Date,
    fin: Date,
  ): Promise<{ reservas: ReservaDelDia[]; bloqueos: BloqueoDelDia[] }> {
    const cruza = (o: { inicio: Date; fin: Date }) =>
      o.inicio < fin && inicio < o.fin;
    return Promise.resolve({
      reservas: this.reservas.filter(cruza),
      bloqueos: this.bloqueos.filter(cruza),
    });
  }
}
