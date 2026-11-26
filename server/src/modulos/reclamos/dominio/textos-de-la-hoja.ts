import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

interface ReglaDeTexto {
  /** Cómo se nombra el dato en los mensajes: «el domicilio», «la descripción». */
  nombre: string;
  maximo: number;
}

function limpiar(texto: string): string {
  return texto.trim().replace(/[ \t]+/g, ' ');
}

function revisarLargo(texto: string, { nombre, maximo }: ReglaDeTexto): string {
  if (texto.length > maximo) {
    const sujeto = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    throw new ValorInvalidoError(
      `${sujeto} no puede tener más de ${maximo} caracteres.`,
    );
  }
  return texto;
}

/** Texto que la persona escribe y no puede quedar vacío. */
export function textoObligatorio(texto: string, regla: ReglaDeTexto): string {
  const limpio = limpiar(texto);
  if (limpio === '') throw new ValorInvalidoError(`Ingresa ${regla.nombre}.`);
  return revisarLargo(limpio, regla);
}

/** Texto que la persona puede dejar vacío; vacío se guarda como `null`. */
export function textoOpcional(
  texto: string | undefined,
  regla: ReglaDeTexto,
): string | null {
  const limpio = limpiar(texto ?? '');
  return limpio === '' ? null : revisarLargo(limpio, regla);
}

export const DOMICILIO = { nombre: 'el domicilio', maximo: 200 };
export const DESCRIPCION = { nombre: 'la descripción', maximo: 200 };
export const DETALLE = { nombre: 'el detalle', maximo: 2000 };
export const PEDIDO = { nombre: 'el pedido', maximo: 1000 };
