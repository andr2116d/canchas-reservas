import {
  ConflictoError,
  type ErroresPorCampo,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';

const LARGO_MAXIMO_DEL_MOTIVO = 200;
const MS_POR_MINUTO = 60 * 1000;

export const TIPOS_DE_BLOQUEO = ['PROGRAMADO', 'EMERGENCIA'] as const;
export type TipoDeBloqueo = (typeof TIPOS_DE_BLOQUEO)[number];
export type EtapaDelBloqueo = 'PROXIMO' | 'EN_CURSO' | 'TERMINADO';

export interface DatosDelBloqueo {
  canchaId: number;
  tipo: string;
  inicio: Date;
  fin: Date;
  motivo: string;
}

export interface FichaDelBloqueo {
  canchaId: number;
  tipo: TipoDeBloqueo;
  inicio: Date;
  fin: Date;
  motivo: string;
  /** Si se liberó antes de terminar, desde cuándo la cancha volvió a estar disponible. */
  liberadoEn: Date | null;
}

const esTipo = (valor: string): valor is TipoDeBloqueo =>
  (TIPOS_DE_BLOQUEO as readonly string[]).includes(valor);

function erroresDe({
  tipo,
  inicio,
  fin,
  motivo,
}: DatosDelBloqueo): ErroresPorCampo {
  const errores: ErroresPorCampo = {};
  const limpio = motivo.trim();
  if (!limpio) errores.motivo = 'Escribe el motivo del bloqueo.';
  else if (limpio.length > LARGO_MAXIMO_DEL_MOTIVO)
    errores.motivo = `Usa como máximo ${LARGO_MAXIMO_DEL_MOTIVO} caracteres.`;
  if (!esTipo(tipo)) errores.tipo = 'Elige si es programado o de emergencia.';
  if (fin <= inicio) errores.hasta = 'El fin debe ser después del inicio.';
  return errores;
}

/**
 * Un rango en que una cancha no se puede reservar por mantenimiento. Al
 * terminar, la cancha vuelve a estar disponible sola: nada que ejecutar.
 */
export class Bloqueo {
  private constructor(
    readonly id: number | undefined,
    private datos: FichaDelBloqueo,
  ) {}

  static crear(datos: DatosDelBloqueo): Bloqueo {
    const errores = erroresDe(datos);
    if (Object.keys(errores).length > 0) throw new ReglaInvalidaError(errores);
    const { canchaId, inicio, fin, motivo } = datos;
    return new Bloqueo(undefined, {
      canchaId,
      tipo: datos.tipo as TipoDeBloqueo,
      inicio,
      fin,
      motivo: motivo.trim(),
      liberadoEn: null,
    });
  }

  static restaurar(id: number, ficha: FichaDelBloqueo): Bloqueo {
    return new Bloqueo(id, ficha);
  }

  get ficha(): FichaDelBloqueo {
    return { ...this.datos };
  }

  /** Hasta cuándo la cancha queda bloqueada: el fin, o el momento en que se liberó. */
  get finEfectivo(): Date {
    return this.datos.liberadoEn ?? this.datos.fin;
  }

  etapa(ahora: Date): EtapaDelBloqueo {
    if (ahora < this.datos.inicio) return 'PROXIMO';
    return ahora < this.finEfectivo ? 'EN_CURSO' : 'TERMINADO';
  }

  /** Termina un bloqueo en curso en el minuto actual: la cancha vuelve a estar disponible. */
  liberar(ahora: Date): void {
    const etapa = this.etapa(ahora);
    if (etapa === 'PROXIMO')
      throw new ConflictoError(
        'El bloqueo aún no empieza: quítalo en lugar de liberarlo.',
        {},
      );
    if (etapa === 'TERMINADO')
      throw new ConflictoError('El bloqueo ya terminó.', {});
    const minuto = new Date(
      Math.floor(ahora.getTime() / MS_POR_MINUTO) * MS_POR_MINUTO,
    );
    this.datos = { ...this.datos, liberadoEn: minuto };
  }

  /** Solo un bloqueo que no empezó se quita entero; uno en curso se libera y uno pasado no se toca. */
  exigirQueNoEmpezo(ahora: Date): void {
    const etapa = this.etapa(ahora);
    if (etapa === 'EN_CURSO')
      throw new ConflictoError(
        'El bloqueo ya empezó: libéralo desde ahora.',
        {},
      );
    if (etapa === 'TERMINADO')
      throw new ConflictoError('El bloqueo ya terminó.', {});
  }
}
