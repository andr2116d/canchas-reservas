import { HoraDelDia } from '../../../compartido/dominio/hora-del-dia.value-object';
import { DIAS_DE_LA_SEMANA, type DiaDeLaSemana } from './dia-de-la-semana';
import type { HorarioDelDia } from './horario-del-dia';

/** Hora de la noche mientras administración no defina otra. Es el único lugar con este valor. */
export const INICIO_DE_LA_NOCHE_POR_DEFECTO = '18:00';

/** Horario de atención de la semana: los días abiertos y desde qué hora es de noche. */
export class HorarioSemanal {
  private constructor(
    readonly inicioDeLaNoche: HoraDelDia,
    private readonly dias: ReadonlyMap<DiaDeLaSemana, HorarioDelDia>,
  ) {}

  static crear(
    inicioDeLaNoche: string,
    dias: ReadonlyMap<DiaDeLaSemana, HorarioDelDia>,
  ) {
    return new HorarioSemanal(HoraDelDia.crear(inicioDeLaNoche), dias);
  }

  static restaurar(
    inicioDeLaNoche: number,
    dias: ReadonlyMap<DiaDeLaSemana, HorarioDelDia>,
  ) {
    return new HorarioSemanal(HoraDelDia.desdeMinutos(inicioDeLaNoche), dias);
  }

  /** Horario del día, o nada si ese día no se abre. */
  del(dia: DiaDeLaSemana): HorarioDelDia | undefined {
    return this.dias.get(dia);
  }

  inicioDeLaNocheDel(dia: DiaDeLaSemana): HoraDelDia {
    return this.dias.get(dia)?.inicioDeLaNoche ?? this.inicioDeLaNoche;
  }

  igualA(otro: HorarioSemanal): boolean {
    if (this.inicioDeLaNoche.minutos !== otro.inicioDeLaNoche.minutos)
      return false;
    return DIAS_DE_LA_SEMANA.every((dia) => {
      const propio = this.del(dia);
      const ajeno = otro.del(dia);
      return propio && ajeno ? propio.igualA(ajeno) : propio === ajeno;
    });
  }
}
