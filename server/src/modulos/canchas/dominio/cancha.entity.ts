import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import {
  esTipoDeCancha,
  type TipoDeCancha,
} from '../../../compartido/dominio/tipo-de-cancha';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import {
  type CaracteristicaDeCancha,
  leerCaracteristicas,
} from './caracteristica-de-cancha';
import { NombreDeCancha } from './nombre-de-cancha.value-object';

const LARGO_MAXIMO_DE_LA_NOTA = 200;

export type EstadoDeCancha = 'OPERATIVA' | 'DESACTIVADA';

/** Datos de una cancha tal como los escribe administración. */
export interface DatosDeCancha {
  nombre: string;
  tipo: string;
  tieneIluminacion: boolean;
  caracteristicas: string[];
  nota?: string;
}

/** Datos validados de una cancha. */
export interface FichaDeCancha {
  nombre: string;
  tipo: TipoDeCancha;
  /** Sin iluminación solo se ofrecen turnos de día. */
  tieneIluminacion: boolean;
  caracteristicas: CaracteristicaDeCancha[];
  nota: string | null;
  estado: EstadoDeCancha;
}

type DatosEditables = Omit<FichaDeCancha, 'estado'>;

/** Lo que cambió en una edición: el valor anterior y el nuevo de cada dato. */
export type CambiosDeCancha = Partial<{
  [Campo in keyof DatosEditables]: {
    antes: DatosEditables[Campo];
    despues: DatosEditables[Campo];
  };
}>;

function leerTipo(valor: string): TipoDeCancha {
  if (!esTipoDeCancha(valor))
    throw new ValorInvalidoError('Elige si es de fútbol 5 o de fútbol 7.');
  return valor;
}

function leerNota(valor = ''): string | null {
  const nota = valor.trim();
  if (nota.length > LARGO_MAXIMO_DE_LA_NOTA)
    throw new ValorInvalidoError(
      `Usa como máximo ${LARGO_MAXIMO_DE_LA_NOTA} caracteres.`,
    );
  return nota === '' ? null : nota;
}

function leerDatos(datos: DatosDeCancha): DatosEditables {
  const leidos = validarCampos({
    nombre: () => NombreDeCancha.crear(datos.nombre),
    tipo: () => leerTipo(datos.tipo),
    caracteristicas: () => leerCaracteristicas(datos.caracteristicas),
    nota: () => leerNota(datos.nota),
  });
  return {
    ...leidos,
    nombre: leidos.nombre.valor,
    tieneIluminacion: datos.tieneIluminacion,
  };
}

const iguales = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/** Una cancha del local con sus características y su estado. */
export class Cancha {
  private constructor(
    readonly id: number | undefined,
    private datos: FichaDeCancha,
  ) {}

  /** Una cancha nueva siempre empieza operativa. */
  static crear(datos: DatosDeCancha): Cancha {
    return new Cancha(undefined, { ...leerDatos(datos), estado: 'OPERATIVA' });
  }

  static restaurar(id: number, ficha: FichaDeCancha): Cancha {
    return new Cancha(id, ficha);
  }

  get ficha(): FichaDeCancha {
    return { ...this.datos, caracteristicas: [...this.datos.caracteristicas] };
  }

  /** Forma del nombre que no puede repetirse entre canchas. */
  get nombreNormalizado(): string {
    return NombreDeCancha.crear(this.datos.nombre).normalizado;
  }

  /** Aplica los datos nuevos y devuelve solo lo que cambió. */
  editar(datos: DatosDeCancha): CambiosDeCancha {
    const nuevos = leerDatos(datos);
    const cambios: Record<string, { antes: unknown; despues: unknown }> = {};
    for (const campo of Object.keys(nuevos) as (keyof DatosEditables)[]) {
      if (!iguales(this.datos[campo], nuevos[campo]))
        cambios[campo] = { antes: this.datos[campo], despues: nuevos[campo] };
    }
    this.datos = { ...this.datos, ...nuevos };
    return cambios as CambiosDeCancha;
  }

  desactivar(): void {
    this.cambiarEstado('DESACTIVADA', 'La cancha ya está desactivada.');
  }

  reactivar(): void {
    this.cambiarEstado('OPERATIVA', 'La cancha ya está operativa.');
  }

  private cambiarEstado(estado: EstadoDeCancha, siYaEsta: string): void {
    if (this.datos.estado === estado) throw new ConflictoError(siYaEsta, {});
    this.datos = { ...this.datos, estado };
  }
}
