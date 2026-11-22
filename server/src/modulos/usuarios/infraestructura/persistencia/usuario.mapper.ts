import type { Cifrador } from '../../../../compartido/aplicacion/cifrador.port';
import type { Prisma } from '../../../../generated/prisma/client';
import type { Correo } from '../../dominio/correo.value-object';
import type { DocumentoIdentidad } from '../../dominio/documento-identidad.value-object';
import type { Usuario } from '../../dominio/usuario.entity';

/** Hash con el que se busca y se exige unicidad del documento sin descifrarlo. */
export function hashDeDocumento(
  documento: DocumentoIdentidad,
  cifrador: Cifrador,
): string {
  return cifrador.hashParaBuscar(documento.identificador());
}

/** Hash con el que se busca y se exige unicidad del correo sin descifrarlo. */
export function hashDeCorreo(correo: Correo, cifrador: Cifrador): string {
  return cifrador.hashParaBuscar(correo.direccion);
}

/** Convierte un usuario nuevo en la fila a guardar, con cada dato personal cifrado. */
export function aFilaNueva(
  usuario: Usuario,
  cifrador: Cifrador,
): Prisma.UsuarioCreateInput {
  return {
    nombresCifrado: cifrador.cifrar(usuario.nombres.texto),
    apellidosCifrado: cifrador.cifrar(usuario.apellidos.texto),
    tipoDocumento: usuario.documento.tipo,
    numeroDocumentoCifrado: cifrador.cifrar(usuario.documento.numero),
    documentoHash: hashDeDocumento(usuario.documento, cifrador),
    correoCifrado: cifrador.cifrar(usuario.correo.direccion),
    correoHash: hashDeCorreo(usuario.correo, cifrador),
    celularCifrado: cifrador.cifrar(usuario.celular.numero),
    contrasenaHash: usuario.contrasenaHash,
    rol: usuario.rol,
    estado: usuario.estado,
  };
}
