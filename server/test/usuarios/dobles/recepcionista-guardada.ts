import { EnMemoriaRecepcionistaRepository } from './en-memoria-recepcionista.repository';
import type { EstadoUsuario } from '../../../src/compartido/dominio/rol-usuario';
import { Celular } from '../../../src/modulos/usuarios/dominio/celular.value-object';
import { Correo } from '../../../src/modulos/usuarios/dominio/correo.value-object';
import { DocumentoIdentidad } from '../../../src/modulos/usuarios/dominio/documento-identidad.value-object';
import { FechaNacimiento } from '../../../src/modulos/usuarios/dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../../../src/modulos/usuarios/dominio/nombre-persona.value-object';
import { Usuario } from '../../../src/modulos/usuarios/dominio/usuario.entity';

/** Repositorio en memoria con una recepcionista ya guardada en el estado indicado. */
export function conUnaRecepcionista(estado: EstadoUsuario = 'ACTIVO') {
  const recepcionistas = new EnMemoriaRecepcionistaRepository();
  const id = recepcionistas.agregar(
    Usuario.registrarRecepcionista(
      {
        nombres: NombrePersona.crear('Rosa', 'nombres'),
        apellidos: NombrePersona.crear('Quispe', 'apellidos'),
        fechaNacimiento: FechaNacimiento.restaurar('1995-02-01'),
        documento: DocumentoIdentidad.crear('DNI', '41234567'),
        correo: Correo.crear('rosa.quispe@laprevia.pe'),
        celular: Celular.crear('912345678'),
        contrasenaHash: 'hash anterior',
      },
      new Date('2026-11-29T15:00:00.000Z'),
    ),
    estado,
  );
  return { recepcionistas, id };
}
