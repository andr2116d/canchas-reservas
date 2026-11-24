import { Monto } from '../../../compartido/dominio/monto.value-object';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { NombreDeAdicional } from './nombre-de-adicional.value-object';

const LARGO_MAXIMO_DE_LA_DESCRIPCION = 200;

export type EstadoDeAdicional = 'ACTIVO' | 'DESACTIVADO';

/** Datos de un adicional tal como los escribe administración. */
export interface DatosDeAdicional {
  nombre: string;
  descripcion?: string;
  /** Soles por unidad perdida o rota, como «15» o «15.50». */
  precio: string;
}

/** Datos validados de un adicional. */
export interface FichaDeAdicional {
  nombre: string;
  descripcion: string | null;
  precio: Monto;
  estado: EstadoDeAdicional;
}

/** Nombre, descripción y precio en soles, como se muestran y se auditan. */
export interface ResumenDeAdicional {
  nombre: string;
  descripcion: string | null;
  precio: string;
}

/** Lo que cambió en una edición: el valor anterior y el nuevo de cada dato. */
export type CambiosDeAdicional = Partial<{
  [Campo in keyof ResumenDeAdicional]: {
    antes: ResumenDeAdicional[Campo];
    despues: ResumenDeAdicional[Campo];
  };
}>;

function leerDescripcion(valor = ''): string | null {
  const descripcion = valor.trim();
  if (descripcion.length > LARGO_MAXIMO_DE_LA_DESCRIPCION)
    throw new ValorInvalidoError(
      `Usa como máximo ${LARGO_MAXIMO_DE_LA_DESCRIPCION} caracteres.`,
    );
  return descripcion === '' ? null : descripcion;
}

function leerDatos(datos: DatosDeAdicional) {
  const leidos = validarCampos({
    nombre: () => NombreDeAdicional.crear(datos.nombre),
    descripcion: () => leerDescripcion(datos.descripcion),
    precio: () => Monto.crear(datos.precio),
  });
  return { ...leidos, nombre: leidos.nombre.valor };
}

/** Material que el local presta en la cancha y su precio por unidad perdida o rota. */
export class Adicional {
  private constructor(
    readonly id: number | undefined,
    private datos: FichaDeAdicional,
  ) {}

  /** Uno nuevo siempre empieza activo. */
  static crear(datos: DatosDeAdicional): Adicional {
    return new Adicional(undefined, { ...leerDatos(datos), estado: 'ACTIVO' });
  }

  static restaurar(id: number, ficha: FichaDeAdicional): Adicional {
    return new Adicional(id, ficha);
  }

  get ficha(): FichaDeAdicional {
    return { ...this.datos };
  }

  get resumen(): ResumenDeAdicional {
    const { nombre, descripcion, precio } = this.datos;
    return { nombre, descripcion, precio: precio.enSoles() };
  }

  /** Forma del nombre que no puede repetirse entre adicionales. */
  get nombreNormalizado(): string {
    return NombreDeAdicional.crear(this.datos.nombre).normalizado;
  }

  /** Aplica los datos nuevos y devuelve solo lo que cambió. */
  editar(datos: DatosDeAdicional): CambiosDeAdicional {
    const antes = this.resumen;
    this.datos = { ...this.datos, ...leerDatos(datos) };
    const despues = this.resumen;
    const cambios: Record<string, { antes: unknown; despues: unknown }> = {};
    for (const campo of Object.keys(despues) as (keyof ResumenDeAdicional)[]) {
      if (antes[campo] !== despues[campo])
        cambios[campo] = { antes: antes[campo], despues: despues[campo] };
    }
    return cambios as CambiosDeAdicional;
  }

  /** Devuelve si cambió: desactivar uno ya desactivado no hace nada. */
  desactivar(): boolean {
    return this.cambiarEstado('DESACTIVADO');
  }

  /** Devuelve si cambió: reactivar uno activo no hace nada. */
  reactivar(): boolean {
    return this.cambiarEstado('ACTIVO');
  }

  private cambiarEstado(estado: EstadoDeAdicional): boolean {
    if (this.datos.estado === estado) return false;
    this.datos = { ...this.datos, estado };
    return true;
  }
}
