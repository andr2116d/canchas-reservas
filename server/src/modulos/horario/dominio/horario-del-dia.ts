import { HoraDelDia } from '../../../compartido/dominio/hora-del-dia.value-object';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

export interface DatosDelDia {
  abre: string;
  cierra: string;
  /** Hora propia de la noche para este día; si falta, rige la general. */
  inicioDeLaNoche?: string;
}

/** Horario de un día abierto: abre y cierra el mismo día, como máximo a medianoche. */
export class HorarioDelDia {
  private constructor(
    readonly abre: HoraDelDia,
    readonly cierra: HoraDelDia,
    readonly inicioDeLaNoche?: HoraDelDia,
  ) {}

  static crear({ abre, cierra, inicioDeLaNoche }: DatosDelDia): HorarioDelDia {
    const apertura = HoraDelDia.crear(abre);
    const cierre = HoraDelDia.crearHastaMedianoche(cierra);
    if (cierre.minutos <= apertura.minutos) {
      throw new ValorInvalidoError(
        'El cierre debe ser después de la apertura.',
      );
    }
    const noche = inicioDeLaNoche
      ? HoraDelDia.crear(inicioDeLaNoche)
      : undefined;
    return new HorarioDelDia(apertura, cierre, noche);
  }

  static restaurar(abre: number, cierra: number, inicioDeLaNoche?: number) {
    const noche =
      inicioDeLaNoche === undefined
        ? undefined
        : HoraDelDia.desdeMinutos(inicioDeLaNoche);
    return new HorarioDelDia(
      HoraDelDia.desdeMinutos(abre),
      HoraDelDia.desdeMinutos(cierra),
      noche,
    );
  }

  igualA(otro: HorarioDelDia): boolean {
    return (
      this.abre.minutos === otro.abre.minutos &&
      this.cierra.minutos === otro.cierra.minutos &&
      this.inicioDeLaNoche?.minutos === otro.inicioDeLaNoche?.minutos
    );
  }
}
