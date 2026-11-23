import {
  NoEncontradoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { Celular } from '../dominio/celular.value-object';
import { Correo } from '../dominio/correo.value-object';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { type DatoEditable, DATOS_EDITABLES } from '../dominio/datos-editables';
import { Dorsal } from '../dominio/dorsal.value-object';
import type { Usuario } from '../dominio/usuario.entity';
import type { UsuarioRepository } from '../dominio/usuario.repository';
import type { ContextoDeCuentas } from './contexto-de-cuentas';

export type CambiosDeMiCuenta = Partial<Record<DatoEditable, string>>;

/** Cambia los datos de contacto de la propia cuenta, según lo que permite cada rol. */
export class ActualizarMiCuentaUseCase {
  constructor(
    private readonly usuarios: Pick<
      UsuarioRepository,
      'buscarPorId' | 'existeConCorreo' | 'actualizarContacto'
    >,
    private readonly contexto: ContextoDeCuentas,
  ) {}

  async ejecutar(
    usuarioId: number,
    enviados: CambiosDeMiCuenta,
  ): Promise<void> {
    // Solo cuentan los datos que llegaron con valor.
    const cambios = Object.fromEntries(
      Object.entries(enviados).filter(([, valor]) => valor !== undefined),
    ) as CambiosDeMiCuenta;
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) throw new NoEncontradoError('No encontramos la cuenta.');
    exigirEditables(usuario, cambios);
    const validados = this.validar(usuario, cambios);
    if (
      validados.correo &&
      validados.correo.direccion !== usuario.correo.direccion &&
      (await this.usuarios.existeConCorreo(validados.correo))
    ) {
      throw new CuentaYaExisteError(['correo']);
    }
    await this.usuarios.actualizarContacto(usuarioId, validados);
  }

  private validar(usuario: Usuario, cambios: CambiosDeMiCuenta) {
    const { correos } = this.contexto;
    const constructores = {
      correo: () =>
        correos.exigirParaRol(usuario.rol, Correo.crear(cambios.correo ?? '')),
      celular: () => Celular.crear(cambios.celular ?? ''),
      dorsal: () => Dorsal.crearOpcional(cambios.dorsal) ?? null,
    };
    const presentes = Object.fromEntries(
      Object.entries(constructores).filter(([campo]) => campo in cambios),
    ) as Partial<typeof constructores>;
    return validarCampos(presentes) as {
      correo?: Correo;
      celular?: Celular;
      dorsal?: Dorsal | null;
    };
  }
}

function exigirEditables(usuario: Usuario, cambios: CambiosDeMiCuenta): void {
  const permitidos: string[] = DATOS_EDITABLES[usuario.rol];
  const ajenos = Object.keys(cambios).filter(
    (campo) => !permitidos.includes(campo),
  );
  if (ajenos.length > 0) {
    throw new ReglaInvalidaError(
      Object.fromEntries(
        ajenos.map((campo) => [
          campo,
          'Este dato no se puede cambiar desde la cuenta.',
        ]),
      ),
    );
  }
}
