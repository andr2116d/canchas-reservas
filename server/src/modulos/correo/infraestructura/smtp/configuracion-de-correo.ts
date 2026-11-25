import {
  type Entorno,
  esEntornoLocal,
  exigir,
  leerEntero,
} from '../../../../compartido/infraestructura/configuracion/configuracion';

/** Servidor SMTP y remitente de los correos del servicio. */
export interface ConfiguracionDeCorreo {
  servidor: string;
  puerto: number;
  usuario?: string;
  contrasena?: string;
  /** Fuera de desarrollo y pruebas la conexión debe ir cifrada (STARTTLS o TLS). */
  exigirTls: boolean;
  remitente: string;
}

const REMITENTE_LOCAL = 'La Previa <avisos@laprevia.test>';
const FORMA_DEL_REMITENTE = /^[^<>]+ <[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/;

function leerRemitente(entorno: Entorno): string {
  const remitente = exigir(entorno, 'CORREO_REMITENTE').trim();
  if (!FORMA_DEL_REMITENTE.test(remitente)) {
    throw new Error(
      'CORREO_REMITENTE debe tener la forma «Nombre <correo@dominio>».',
    );
  }
  return remitente;
}

/**
 * En desarrollo y pruebas usa Mailpit en localhost:1025. En producción exige el servidor,
 * las credenciales y el remitente del proveedor (por ejemplo, la interfaz SMTP de Amazon SES).
 */
export function leerConfiguracionDeCorreo(
  entorno: Entorno,
): ConfiguracionDeCorreo {
  if (esEntornoLocal(entorno)) {
    return {
      servidor: entorno.SMTP_SERVIDOR || 'localhost',
      puerto: leerEntero(entorno, 'SMTP_PUERTO', 1025),
      exigirTls: false,
      remitente: entorno.CORREO_REMITENTE
        ? leerRemitente(entorno)
        : REMITENTE_LOCAL,
    };
  }
  return {
    servidor: exigir(entorno, 'SMTP_SERVIDOR'),
    puerto: leerEntero(entorno, 'SMTP_PUERTO', 587),
    usuario: exigir(entorno, 'SMTP_USUARIO'),
    contrasena: exigir(entorno, 'SMTP_CONTRASENA'),
    exigirTls: true,
    remitente: leerRemitente(entorno),
  };
}
