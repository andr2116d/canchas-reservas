import type { Correo } from '../../src/modulos/usuarios/dominio/correo.value-object';
import { CuentaYaExisteError } from '../../src/modulos/usuarios/dominio/cuenta-ya-existe.error';
import type { DocumentoIdentidad } from '../../src/modulos/usuarios/dominio/documento-identidad.value-object';
import { Usuario } from '../../src/modulos/usuarios/dominio/usuario.entity';
import type { UsuarioRepository } from '../../src/modulos/usuarios/dominio/usuario.repository';

/** Repositorio en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaUsuarioRepository implements UsuarioRepository {
  private readonly usuarios: Usuario[] = [];

  existeConDocumento(documento: DocumentoIdentidad): Promise<boolean> {
    const identificador = documento.identificador();
    return Promise.resolve(
      this.usuarios.some((u) => u.documento.identificador() === identificador),
    );
  }

  existeConCorreo(correo: Correo): Promise<boolean> {
    return Promise.resolve(
      this.usuarios.some((u) => u.correo.direccion === correo.direccion),
    );
  }

  buscarPorId(id: number): Promise<Usuario | undefined> {
    return Promise.resolve(this.usuarios.find((u) => u.id === id));
  }

  async crear(usuario: Usuario): Promise<number> {
    const [documentoUsado, correoUsado] = await Promise.all([
      this.existeConDocumento(usuario.documento),
      this.existeConCorreo(usuario.correo),
    ]);
    if (documentoUsado) throw new CuentaYaExisteError(['numeroDocumento']);
    if (correoUsado) throw new CuentaYaExisteError(['correo']);

    const id = this.usuarios.length + 1;
    this.usuarios.push(
      Usuario.restaurar({
        id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        fechaNacimiento: usuario.fechaNacimiento,
        documento: usuario.documento,
        correo: usuario.correo,
        celular: usuario.celular,
        contrasenaHash: usuario.contrasenaHash,
        rol: usuario.rol,
        estado: usuario.estado,
      }),
    );
    return id;
  }

  /** Lista lo guardado, para que las pruebas lo inspeccionen. */
  todos(): readonly Usuario[] {
    return this.usuarios;
  }
}
