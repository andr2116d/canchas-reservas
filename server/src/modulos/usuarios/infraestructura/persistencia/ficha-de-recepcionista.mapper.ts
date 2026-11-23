import type { Cifrador } from '../../../../compartido/aplicacion/cifrador.port';
import type { Usuario as FilaUsuario } from '../../../../generated/prisma/client';
import type { FichaDeRecepcionista } from '../../dominio/recepcionista.repository';

/** Descifra los datos de una recepcionista para mostrarlos al administrador. */
export function aFicha(
  fila: FilaUsuario,
  cifrador: Cifrador,
): FichaDeRecepcionista {
  const descifrar = (valor: string | null) =>
    valor === null ? '' : cifrador.descifrar(valor);
  return {
    id: fila.id,
    nombres: descifrar(fila.nombresCifrado),
    apellidos: descifrar(fila.apellidosCifrado),
    correo: descifrar(fila.correoCifrado),
    tipoDocumento: fila.tipoDocumento ?? '',
    numeroDocumento: descifrar(fila.numeroDocumentoCifrado),
    fechaNacimiento: descifrar(fila.fechaNacimientoCifrada),
    celular: descifrar(fila.celularCifrado),
    estado: fila.estado,
    requiereCambiarContrasena: fila.requiereCambiarContrasena,
    creadaEn: fila.creadoEn,
  };
}
