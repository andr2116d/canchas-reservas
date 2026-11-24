import type { RolUsuario } from '../../../src/compartido/dominio/rol-usuario';
import type { AccionAuditada } from '../../../src/modulos/usuarios/dominio/accion-auditada';
import type { Correo } from '../../../src/modulos/usuarios/dominio/correo.value-object';
import { CuentaYaExisteError } from '../../../src/modulos/usuarios/dominio/cuenta-ya-existe.error';
import type { DocumentoIdentidad } from '../../../src/modulos/usuarios/dominio/documento-identidad.value-object';
import { Usuario } from '../../../src/modulos/usuarios/dominio/usuario.entity';
import type {
  CambioPropio,
  UsuarioRepository,
} from '../../../src/modulos/usuarios/dominio/usuario.repository';

/** Repositorio en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaUsuarioRepository implements UsuarioRepository {
  private readonly usuarios: Usuario[] = [];
  /** Acciones de cada persona sobre su cuenta, como las guarda la auditoría. */
  readonly auditoria: {
    usuarioId: number;
    accion: AccionAuditada;
    ocurridoEn: Date;
  }[] = [];
  /** Tokens de las sesiones que quedaron abiertas tras el último cambio, si cerró las demás. */
  sesionConservada?: string;

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
    this.usuarios.push(Usuario.restaurar({ ...usuario.estadoGuardado, id }));
    return id;
  }

  async crearPersonal(usuario: Usuario): Promise<void> {
    await this.crear(usuario);
  }

  aplicarCambioPropio(cambio: CambioPropio): Promise<boolean> {
    const indice = this.usuarios.findIndex((u) => u.id === cambio.usuarioId);
    const actual = this.usuarios[indice].estadoGuardado;
    if (cambio.marca === 'DATOS_CONFIRMADOS' && actual.datosConfirmadosEn)
      return Promise.resolve(false);
    if (cambio.marca === 'DOCUMENTO_CAMBIADO' && actual.documentoCambiadoEn)
      return Promise.resolve(false);
    const { dorsal, ...datos } = cambio.datos;
    const definidos = Object.fromEntries(
      Object.entries(datos).filter(([, valor]) => valor !== undefined),
    );
    this.usuarios[indice] = Usuario.restaurar({
      ...actual,
      ...definidos,
      id: cambio.usuarioId,
      dorsal: dorsal === undefined ? actual.dorsal : (dorsal ?? undefined),
      ...(cambio.marca === 'DATOS_CONFIRMADOS' && {
        datosConfirmadosEn: cambio.ocurridoEn,
      }),
      ...(cambio.marca === 'DOCUMENTO_CAMBIADO' && {
        documentoCambiadoEn: cambio.ocurridoEn,
      }),
    });
    this.auditoria.push({
      usuarioId: cambio.usuarioId,
      accion: cambio.accion,
      ocurridoEn: cambio.ocurridoEn,
    });
    this.sesionConservada = cambio.conservarSesion;
    return Promise.resolve(true);
  }

  contarAccionesPropias(
    usuarioId: number,
    acciones: AccionAuditada[],
    desde: Date,
  ): Promise<number> {
    return Promise.resolve(
      this.auditoria.filter(
        (a) =>
          a.usuarioId === usuarioId &&
          acciones.includes(a.accion) &&
          a.ocurridoEn >= desde,
      ).length,
    );
  }

  /** Lista lo guardado, para que las pruebas lo inspeccionen. */
  todos(): readonly Usuario[] {
    return this.usuarios;
  }
}
