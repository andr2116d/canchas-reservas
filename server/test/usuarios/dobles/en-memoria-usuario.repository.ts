import type { RolUsuario } from '../../../src/compartido/dominio/rol-usuario';
import type { Correo } from '../../../src/modulos/usuarios/dominio/correo.value-object';
import { CuentaYaExisteError } from '../../../src/modulos/usuarios/dominio/cuenta-ya-existe.error';
import type { DocumentoIdentidad } from '../../../src/modulos/usuarios/dominio/documento-identidad.value-object';
import { Usuario } from '../../../src/modulos/usuarios/dominio/usuario.entity';
import type {
  ContactoNuevo,
  UsuarioRepository,
} from '../../../src/modulos/usuarios/dominio/usuario.repository';

/** Repositorio en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaUsuarioRepository implements UsuarioRepository {
  private readonly usuarios: Usuario[] = [];

  existeConDocumento(
    documento: DocumentoIdentidad,
    rol: RolUsuario,
  ): Promise<boolean> {
    const identificador = documento.identificador();
    return Promise.resolve(
      this.usuarios.some(
        (u) => u.rol === rol && u.documento?.identificador() === identificador,
      ),
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
      usuario.documento &&
        this.existeConDocumento(usuario.documento, usuario.rol),
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
        dorsal: usuario.dorsal,
        rol: usuario.rol,
        estado: usuario.estado,
        requiereCambiarContrasena: usuario.requiereCambiarContrasena,
        contrasenaTemporalVenceEn: usuario.contrasenaTemporalVenceEn,
      }),
    );
    return id;
  }

  actualizarContacto(id: number, contacto: ContactoNuevo): Promise<void> {
    const indice = this.usuarios.findIndex((u) => u.id === id);
    const actual = this.usuarios[indice];
    this.usuarios[indice] = Usuario.restaurar({
      id,
      nombres: actual.nombres,
      apellidos: actual.apellidos,
      fechaNacimiento: actual.fechaNacimiento,
      documento: actual.documento,
      correo: contacto.correo ?? actual.correo,
      celular: contacto.celular ?? actual.celular,
      dorsal:
        contacto.dorsal === undefined
          ? actual.dorsal
          : (contacto.dorsal ?? undefined),
      contrasenaHash: actual.contrasenaHash,
      rol: actual.rol,
      estado: actual.estado,
      requiereCambiarContrasena: actual.requiereCambiarContrasena,
      contrasenaTemporalVenceEn: actual.contrasenaTemporalVenceEn,
    });
    return Promise.resolve();
  }

  async crearPersonal(usuario: Usuario): Promise<void> {
    await this.crear(usuario);
  }

  /** Lista lo guardado, para que las pruebas lo inspeccionen. */
  todos(): readonly Usuario[] {
    return this.usuarios;
  }
}
