import { Celular } from '../dominio/celular.value-object';
import { DocumentoIdentidad } from '../../../compartido/dominio/documento-identidad.value-object';
import { FechaNacimiento } from '../dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../../../compartido/dominio/nombre-persona.value-object';

/** Datos personales tal como se escriben en un formulario. */
export interface DatosPersonalesEscritos {
  nombres: string;
  apellidos: string;
  /** AAAA-MM-DD, como la entrega un campo de fecha del navegador. */
  fechaNacimiento: string;
  tipoDocumento: string;
  numeroDocumento: string;
  celular: string;
}

/**
 * Construye los datos personales comunes a jugadores y personal, para
 * validarlos con `validarCampos` junto a los propios de cada cuenta.
 */
export function construirDatosPersonales(
  datos: DatosPersonalesEscritos,
  ahora: Date,
) {
  return {
    nombres: () => NombrePersona.crear(datos.nombres, 'nombres'),
    apellidos: () => NombrePersona.crear(datos.apellidos, 'apellidos'),
    fechaNacimiento: () => FechaNacimiento.crear(datos.fechaNacimiento, ahora),
    numeroDocumento: () =>
      DocumentoIdentidad.crear(datos.tipoDocumento, datos.numeroDocumento),
    celular: () => Celular.crear(datos.celular),
  };
}
