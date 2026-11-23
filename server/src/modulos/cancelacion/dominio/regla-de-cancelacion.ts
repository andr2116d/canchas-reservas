import {
  type ErroresPorCampo,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

const MAXIMO_DE_RANGOS = 10;
const MAXIMO_DE_HORAS = 720;

/** Un rango tal como lo escribe administración. */
export interface DatosDelRango {
  desdeHoras: string;
  porcentaje: string;
  ofreceCredito: boolean;
}

/** Desde cuántas horas antes rige, cuánto del anticipo devuelve y si ofrece crédito. */
export interface RangoDeCancelacion {
  desdeHoras: number;
  porcentaje: number;
  /** Solo en rangos que devuelven algo: el dinero siempre está disponible. */
  ofreceCredito: boolean;
}

interface RangoLeido extends RangoDeCancelacion {
  indice: number;
}

function leerEntero(
  texto: string,
  maximo: number,
  vacio: string,
  invalido: string,
): number {
  const limpio = texto.trim();
  if (limpio === '') throw new ValorInvalidoError(vacio);
  if (!/^\d+$/.test(limpio) || Number(limpio) > maximo)
    throw new ValorInvalidoError(invalido);
  return Number(limpio);
}

/** Lee cada rango y reúne los errores de todos, con la posición del rango en la clave. */
function leerRangos(datos: DatosDelRango[]): RangoLeido[] {
  const errores: ErroresPorCampo = {};
  const leidos = datos.flatMap((dato, indice): RangoLeido[] => {
    const leer = (campo: string, leerValor: () => number) => {
      try {
        return leerValor();
      } catch (error) {
        if (!(error instanceof ValorInvalidoError)) throw error;
        errores[`rangos.${indice}.${campo}`] = error.message;
      }
    };
    const desdeHoras = leer('desdeHoras', () =>
      leerEntero(
        dato.desdeHoras,
        MAXIMO_DE_HORAS,
        'Ingresa desde cuántas horas antes rige.',
        'Usa horas enteras de 0 a 720.',
      ),
    );
    const porcentaje = leer('porcentaje', () =>
      leerEntero(
        dato.porcentaje,
        100,
        'Ingresa el porcentaje que se devuelve.',
        'Usa un porcentaje entero de 0 a 100.',
      ),
    );
    if (desdeHoras === undefined || porcentaje === undefined) return [];
    return [
      {
        indice,
        desdeHoras,
        porcentaje,
        ofreceCredito: porcentaje > 0 && dato.ofreceCredito,
      },
    ];
  });
  if (Object.keys(errores).length > 0) throw new ReglaInvalidaError(errores);
  return leidos;
}

/** Sin inicios repetidos y con un rango desde 0 horas: toda cancelación cae en un solo rango. */
function exigirCobertura(rangos: RangoLeido[]) {
  const repetido = rangos.find(
    (rango, posicion) =>
      rangos.findIndex((otro) => otro.desdeHoras === rango.desdeHoras) <
      posicion,
  );
  if (repetido) {
    throw new ReglaInvalidaError({
      [`rangos.${repetido.indice}.desdeHoras`]:
        'Ya hay otro rango desde esas horas.',
    });
  }
  if (!rangos.some((rango) => rango.desdeHoras === 0)) {
    throw new ReglaInvalidaError({
      rangos:
        'Agrega un rango desde 0 horas: toda cancelación debe caer en uno.',
    });
  }
}

/** El primer rango devuelve algo y ninguno devuelve más que uno con más anticipación. */
function exigirDevolucionRazonable(ordenados: RangoLeido[]) {
  const [primero] = ordenados;
  if (primero.porcentaje === 0) {
    throw new ReglaInvalidaError({
      [`rangos.${primero.indice}.porcentaje`]:
        'Debe devolver algo: no se permite negar la devolución en todos los casos.',
    });
  }
  ordenados.slice(1).forEach((rango, posicion) => {
    const anterior = ordenados[posicion];
    if (rango.porcentaje > anterior.porcentaje) {
      throw new ReglaInvalidaError({
        [`rangos.${rango.indice}.porcentaje`]: `No puede devolver más que el rango desde ${anterior.desdeHoras} h.`,
      });
    }
  });
}

/**
 * Regla de cancelación del local: rangos «desde N horas antes», de más a menos
 * anticipación, sin huecos ni cruces. El límite exacto cuenta para el rango mayor.
 */
export class ReglaDeCancelacion {
  private constructor(readonly rangos: readonly RangoDeCancelacion[]) {}

  static crear(datos: DatosDelRango[]): ReglaDeCancelacion {
    if (datos.length > MAXIMO_DE_RANGOS)
      throw new ReglaInvalidaError({ rangos: 'Usa como máximo 10 rangos.' });
    const leidos = leerRangos(datos);
    exigirCobertura(leidos);
    const ordenados = [...leidos].sort((a, b) => b.desdeHoras - a.desdeHoras);
    exigirDevolucionRazonable(ordenados);
    return ReglaDeCancelacion.restaurar(ordenados);
  }

  static restaurar(rangos: readonly RangoDeCancelacion[]): ReglaDeCancelacion {
    const ordenados = [...rangos].sort((a, b) => b.desdeHoras - a.desdeHoras);
    return new ReglaDeCancelacion(
      ordenados.map(({ desdeHoras, porcentaje, ofreceCredito }) => ({
        desdeHoras,
        porcentaje,
        ofreceCredito,
      })),
    );
  }

  /** Rango que corresponde a cancelar con esa anticipación, en minutos. */
  rangoPara(minutosDeAnticipacion: number): RangoDeCancelacion {
    const rango = this.rangos.find(
      (posible) => minutosDeAnticipacion >= posible.desdeHoras * 60,
    );
    return rango ?? this.rangos[this.rangos.length - 1];
  }

  igualA(otra: ReglaDeCancelacion): boolean {
    return JSON.stringify(this.rangos) === JSON.stringify(otra.rangos);
  }
}
