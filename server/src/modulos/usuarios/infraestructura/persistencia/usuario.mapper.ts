import type { Cifrador } from '../../../../compartido/aplicacion/cifrador.port';
import type {
  Usuario as FilaUsuario,
  Prisma,
} from '../../../../generated/prisma/client';
import { Celular } from '../../dominio/celular.value-object';
import { Correo } from '../../dominio/correo.value-object';
import { DocumentoIdentidad } from '../../dominio/documento-identidad.value-object';
import { Dorsal } from '../../dominio/dorsal.value-object';
import { FechaNacimiento } from '../../dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../../dominio/nombre-persona.value-object';
import { Usuario } from '../../dominio/usuario.entity';

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
    fechaNacimientoCifrada:
      usuario.fechaNacimiento && cifrador.cifrar(usuario.fechaNacimiento.fecha),
    tipoDocumento: usuario.documento?.tipo,
    numeroDocumentoCifrado:
      usuario.documento && cifrador.cifrar(usuario.documento.numero),
    documentoHash:
      usuario.documento && hashDeDocumento(usuario.documento, cifrador),
    correoCifrado: cifrador.cifrar(usuario.correo.direccion),
    correoHash: hashDeCorreo(usuario.correo, cifrador),
    celularCifrado: usuario.celular && cifrador.cifrar(usuario.celular.numero),
    contrasenaHash: usuario.contrasenaHash,
    dorsal: usuario.dorsal?.numero ?? null,
    rol: usuario.rol,
    estado: usuario.estado,
    requiereCambiarContrasena: usuario.requiereCambiarContrasena,
  };
}

/** Reconstruye el usuario de una fila guardada, descifrando sus datos personales. */
export function aEntidad(fila: FilaUsuario, cifrador: Cifrador): Usuario {
  const descifrar = (valor: string) => cifrador.descifrar(valor);
  return Usuario.restaurar({
    id: fila.id,
    nombres: NombrePersona.crear(descifrar(fila.nombresCifrado), 'nombres'),
    apellidos: NombrePersona.crear(
      descifrar(fila.apellidosCifrado),
      'apellidos',
    ),
    fechaNacimiento: fila.fechaNacimientoCifrada
      ? FechaNacimiento.restaurar(descifrar(fila.fechaNacimientoCifrada))
      : undefined,
    documento:
      fila.tipoDocumento && fila.numeroDocumentoCifrado
        ? DocumentoIdentidad.crear(
            fila.tipoDocumento,
            descifrar(fila.numeroDocumentoCifrado),
          )
        : undefined,
    correo: Correo.crear(descifrar(fila.correoCifrado)),
    celular: fila.celularCifrado
      ? Celular.crear(descifrar(fila.celularCifrado))
      : undefined,
    contrasenaHash: fila.contrasenaHash,
    dorsal: fila.dorsal === null ? undefined : Dorsal.restaurar(fila.dorsal),
    rol: fila.rol,
    estado: fila.estado,
    requiereCambiarContrasena: fila.requiereCambiarContrasena,
  });
}
