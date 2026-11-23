import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import type { SesionAbierta, SesionValida } from '../../sesiones/api-sesiones';
import { Contrasena } from '../dominio/contrasena.value-object';
import { CambioDeContrasenaBase } from './cambio-de-contrasena.base';

/** Cambia la contraseña desde la cuenta, comprobando primero la actual. */
export class CambiarMiContrasenaUseCase extends CambioDeContrasenaBase {
  async ejecutar(
    sesion: SesionValida,
    actual: string,
    nueva: string,
  ): Promise<SesionAbierta | undefined> {
    const { contrasena } = validarCampos({
      contrasena: () => Contrasena.crear(nueva),
    });
    const usuario = await this.accesos.buscarPorUsuario(sesion.usuarioId);
    if (!usuario || usuario.estado !== 'ACTIVO') return undefined;
    if (!(await this.verificarContrasena(actual, usuario.contrasenaHash))) {
      throw new ReglaInvalidaError({
        actual: 'La contraseña actual no es correcta.',
      });
    }
    if (actual === nueva) {
      throw new ReglaInvalidaError({
        contrasena: 'Elige una contraseña distinta a la actual.',
      });
    }
    return this.guardar(sesion, usuario, contrasena);
  }
}
