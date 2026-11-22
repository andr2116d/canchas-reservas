import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

export const TIPOS_DOCUMENTO = ['DNI', 'CARNE_EXTRANJERIA'] as const;
export const MENSAJE_ELEGIR_TIPO_DOCUMENTO = 'Elige tu tipo de documento.';
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

/** Devuelve el mensaje de lo que falla en el número, o nada si es válido. */
type ReglaDeNumero = (numero: string) => string | undefined;

const REGLAS_POR_TIPO: Record<TipoDocumento, ReglaDeNumero> = {
  DNI: (numero) => {
    if (!/^\d+$/.test(numero)) return 'El DNI solo debe contener números.';
    if (numero.length !== 8) return 'El DNI debe tener 8 dígitos.';
    return undefined;
  },
  // SUNAT lo define alfanumérico de hasta 12; Migraciones emite números de 9.
  CARNE_EXTRANJERIA: (numero) => {
    if (!/^[A-Z0-9]+$/.test(numero)) {
      return 'El carné de extranjería solo admite letras y números.';
    }
    if (numero.length < 9 || numero.length > 12) {
      return 'El carné de extranjería debe tener entre 9 y 12 caracteres.';
    }
    return undefined;
  },
};

function esTipoDocumento(valor: string): valor is TipoDocumento {
  return (TIPOS_DOCUMENTO as readonly string[]).includes(valor);
}

/** Documento de identidad de una persona en el Perú: DNI o carné de extranjería. */
export class DocumentoIdentidad {
  private constructor(
    readonly tipo: TipoDocumento,
    readonly numero: string,
  ) {}

  /** Valida el número según las reglas de su tipo. */
  static crear(tipo: string, numero: string): DocumentoIdentidad {
    if (!esTipoDocumento(tipo)) {
      throw new ValorInvalidoError(MENSAJE_ELEGIR_TIPO_DOCUMENTO);
    }
    const normalizado = numero.trim().toUpperCase();
    if (normalizado === '') {
      throw new ValorInvalidoError('Ingresa tu número de documento.');
    }
    const error = REGLAS_POR_TIPO[tipo](normalizado);
    if (error) throw new ValorInvalidoError(error);
    return new DocumentoIdentidad(tipo, normalizado);
  }

  /** Identifica al documento entre todos los tipos: el mismo número en otro tipo es otro documento. */
  identificador(): string {
    return `${this.tipo}:${this.numero}`;
  }
}
