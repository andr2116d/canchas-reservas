import { HoraDelDia } from '../../../compartido/dominio/hora-del-dia.value-object';
import {
  type ErroresPorCampo,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import {
  DIAS_DE_LA_SEMANA,
  type DiaDeLaSemana,
} from '../dominio/dia-de-la-semana';
import { HorarioDelDia } from '../dominio/horario-del-dia';
import { HorarioSemanal } from '../dominio/horario-semanal';

/** Un día tal como lo envía administración. */
export interface DatosDeUnDia {
  dia: string;
  abierto: boolean;
  abre?: string;
  cierra?: string;
  inicioDeLaNoche?: string;
}

export interface DatosDelHorario {
  inicioDeLaNoche: string;
  dias: DatosDeUnDia[];
}

const SIETE_DIAS = 'Indica el horario de los siete días, una vez cada uno.';

/** Guarda en `errores` el mensaje de un valor inválido bajo su campo. */
function intentar<T>(errores: ErroresPorCampo, campo: string, crear: () => T) {
  try {
    return crear();
  } catch (error) {
    if (!(error instanceof ValorInvalidoError)) throw error;
    errores[campo] = error.message;
  }
}

function construirDia(datos: DatosDeUnDia, errores: ErroresPorCampo) {
  const campo = (nombre: string) => `${datos.dia}.${nombre}`;
  const abre = intentar(errores, campo('abre'), () =>
    HoraDelDia.crear(datos.abre ?? ''),
  );
  const cierra = intentar(errores, campo('cierra'), () =>
    HoraDelDia.crearHastaMedianoche(datos.cierra ?? ''),
  );
  const noche = datos.inicioDeLaNoche;
  if (noche)
    intentar(errores, campo('inicioDeLaNoche'), () => HoraDelDia.crear(noche));
  if (!abre || !cierra) return undefined;
  return intentar(errores, campo('cierra'), () =>
    HorarioDelDia.crear({
      abre: abre.texto,
      cierra: datos.cierra ?? '',
      inicioDeLaNoche: noche,
    }),
  );
}

function sonLosSieteDias(dias: DatosDeUnDia[]): boolean {
  const distintos = new Set(dias.map((datos) => datos.dia));
  return (
    dias.length === DIAS_DE_LA_SEMANA.length &&
    DIAS_DE_LA_SEMANA.every((dia) => distintos.has(dia))
  );
}

/**
 * Construye el horario semanal y reúne los errores de cada día bajo
 * `DIA.campo` (por ejemplo `MARTES.cierra`), para marcarlos en su lugar.
 */
export function construirHorario(datos: DatosDelHorario): HorarioSemanal {
  if (!sonLosSieteDias(datos.dias))
    throw new ReglaInvalidaError({ dias: SIETE_DIAS });
  const errores: ErroresPorCampo = {};
  intentar(errores, 'inicioDeLaNoche', () =>
    HoraDelDia.crear(datos.inicioDeLaNoche),
  );
  const abiertos = new Map<DiaDeLaSemana, HorarioDelDia>();
  for (const dia of datos.dias.filter((datosDelDia) => datosDelDia.abierto)) {
    const horario = construirDia(dia, errores);
    if (horario) abiertos.set(dia.dia as DiaDeLaSemana, horario);
  }
  if (Object.keys(errores).length > 0) throw new ReglaInvalidaError(errores);
  return HorarioSemanal.crear(datos.inicioDeLaNoche, abiertos);
}
