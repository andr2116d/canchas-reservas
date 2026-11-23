import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import type { SesionAbierta, SesionValida } from '../../sesiones/api-sesiones';
import { Contrasena } from '../dominio/contrasena.value-object';
import { CambioDeContrasenaBase } from './cambio-de-contrasena.base';

/** Reemplaza la contraseña temporal por una elegida por la persona. */
export class CambiarContrasenaTemporalUseCase extends CambioDeContrasenaBase {
  async ejecutar(
    sesion: SesionValida,
    texto: string,
  ): Promise<SesionAbierta | undefined> {
    const { contrasena } = validarCampos({
      contrasena: () => Contrasena.crear(texto),
    });
    const usuario = await this.accesos.buscarPorUsuario(sesion.usuarioId);
    if (!usuario?.requiereCambiarContrasena || usuario.estado !== 'ACTIVO')
      return undefined;
    if (await this.verificarContrasena(texto, usuario.contrasenaHash)) {
      throw new ReglaInvalidaError({
        contrasena: 'Elige una contraseña distinta a la temporal.',
      });
    }
    return this.guardar(sesion, usuario, contrasena);
  }
}
