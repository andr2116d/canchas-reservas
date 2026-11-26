import { Correo } from '../../../compartido/dominio/correo.value-object';
import {
  type ErroresPorCampo,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { DocumentoIdentidad } from '../../../compartido/dominio/documento-identidad.value-object';
import { Monto } from '../../../compartido/dominio/monto.value-object';
import { NombrePersona } from '../../../compartido/dominio/nombre-persona.value-object';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import {
  elegir,
  MEDIOS_DE_RESPUESTA,
  SERVICIOS,
  TIPOS_DE_HOJA,
} from './opciones-de-la-hoja';
import { leerTelefono } from './telefono';
import {
  DESCRIPCION,
  DETALLE,
  DOMICILIO,
  PEDIDO,
  textoObligatorio,
  textoOpcional,
} from './textos-de-la-hoja';

/** Lo que escribe quien reclama, tal como llega del formulario. */
export interface DatosDeLaHoja {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  domicilio: string;
  telefono: string;
  correo: string;
  esMenorDeEdad: boolean;
  representanteNombre?: string;
  representanteDomicilio?: string;
  representanteTelefono?: string;
  representanteCorreo?: string;
  servicio: string;
  montoReclamado?: string;
  descripcionDelServicio?: string;
  tipo: string;
  detalle: string;
  pedido: string;
  medioDeRespuesta: string;
}

export interface Consumidor {
  documento: { tipo: string; numero: string };
  nombres: string;
  apellidos: string;
  domicilio: string;
  telefono: string;
  correo: string;
}

export interface Representante {
  nombre: string;
  domicilio: string;
  telefono: string;
  correo: string;
}

function leerConsumidor(datos: DatosDeLaHoja) {
  return validarCampos({
    numeroDocumento: () =>
      DocumentoIdentidad.crear(datos.tipoDocumento, datos.numeroDocumento),
    nombres: () => NombrePersona.crear(datos.nombres, 'nombres').texto,
    apellidos: () => NombrePersona.crear(datos.apellidos, 'apellidos').texto,
    domicilio: () => textoObligatorio(datos.domicilio, DOMICILIO),
    telefono: () => leerTelefono(datos.telefono),
    correo: () => Correo.crear(datos.correo).direccion,
  });
}

function leerRepresentante(datos: DatosDeLaHoja) {
  return validarCampos({
    representanteNombre: () =>
      textoObligatorio(datos.representanteNombre ?? '', {
        nombre: 'el nombre de quien representa a la persona menor de edad',
        maximo: 160,
      }),
    representanteDomicilio: () =>
      textoObligatorio(datos.representanteDomicilio ?? '', DOMICILIO),
    representanteTelefono: () =>
      leerTelefono(datos.representanteTelefono ?? ''),
    representanteCorreo: () =>
      Correo.crear(datos.representanteCorreo ?? '').direccion,
  });
}

function leerReclamo(datos: DatosDeLaHoja) {
  return validarCampos({
    servicio: () =>
      elegir(datos.servicio, SERVICIOS, 'Elige el servicio contratado.'),
    montoReclamado: () =>
      datos.montoReclamado?.trim() ? Monto.crear(datos.montoReclamado) : null,
    descripcionDelServicio: () =>
      textoOpcional(datos.descripcionDelServicio, DESCRIPCION),
    tipo: () =>
      elegir(datos.tipo, TIPOS_DE_HOJA, 'Elige si es un reclamo o una queja.'),
    detalle: () => textoObligatorio(datos.detalle, DETALLE),
    pedido: () => textoObligatorio(datos.pedido, PEDIDO),
    medioDeRespuesta: () =>
      elegir(
        datos.medioDeRespuesta,
        MEDIOS_DE_RESPUESTA,
        'Elige cómo recibir la respuesta.',
      ),
  });
}

/** Lee una parte de la hoja y, si falla, guarda sus errores para informarlos todos juntos. */
function leerParte<T>(leer: () => T, errores: ErroresPorCampo): T | null {
  try {
    return leer();
  } catch (error) {
    if (!(error instanceof ReglaInvalidaError)) throw error;
    Object.assign(errores, error.errores);
    return null;
  }
}

/** Junta los errores de las tres partes de la hoja en una sola respuesta. */
export function leerDatosDeLaHoja(datos: DatosDeLaHoja) {
  const errores: ErroresPorCampo = {};
  const consumidor = leerParte(() => leerConsumidor(datos), errores);
  const representante = datos.esMenorDeEdad
    ? leerParte(() => leerRepresentante(datos), errores)
    : null;
  const reclamo = leerParte(() => leerReclamo(datos), errores);
  if (!consumidor || !reclamo || Object.keys(errores).length > 0) {
    throw new ReglaInvalidaError(errores);
  }
  return { consumidor, representante, reclamo };
}
