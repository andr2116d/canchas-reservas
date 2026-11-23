import {
  DIAS_DE_LA_SEMANA,
  type DiaDeLaSemana,
} from '../dominio/dia-de-la-semana';
import type { VersionDeHorario } from '../dominio/horario.repository';

export interface VistaDelDia {
  dia: DiaDeLaSemana;
  abierto: boolean;
  abre?: string;
  cierra?: string;
  /** Solo si el día tiene una hora de noche propia. */
  inicioDeLaNoche?: string;
}

/** Horario listo para mostrar, con los siete días en orden. */
export interface VistaDeHorario {
  inicioDeLaNoche: string;
  dias: VistaDelDia[];
  guardadoEn: Date;
  guardadoPor: string;
}

export function aVista({
  horario,
  guardadoEn,
  guardadoPor,
}: VersionDeHorario): VistaDeHorario {
  const dias = DIAS_DE_LA_SEMANA.map((dia): VistaDelDia => {
    const delDia = horario.del(dia);
    if (!delDia) return { dia, abierto: false };
    const vista: VistaDelDia = {
      dia,
      abierto: true,
      abre: delDia.abre.texto,
      cierra: delDia.cierra.texto,
    };
    if (delDia.inicioDeLaNoche)
      vista.inicioDeLaNoche = delDia.inicioDeLaNoche.texto;
    return vista;
  });
  return {
    inicioDeLaNoche: horario.inicioDeLaNoche.texto,
    dias,
    guardadoEn,
    guardadoPor,
  };
}
