import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import type {
  AbrirSesionUseCase,
  SesionAbierta,
  SesionValida,
} from '../../sesiones/api-sesiones';
import type { AccesoRepository } from '../dominio/acceso.repository';
import { Contrasena } from '../dominio/contrasena.value-object';
import type { HasheadorContrasena } from './hasheador-contrasena.port';
import type { VerificarContrasena } from './iniciar-sesion.use-case';

export class CambiarContrasenaTemporalUseCase {
  constructor(
    private readonly accesos: AccesoRepository,
    private readonly hasheador: HasheadorContrasena,
    private readonly verificarContrasena: VerificarContrasena,
    private readonly abrirSesion: AbrirSesionUseCase,
  ) {}

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

    const contrasenaHashNueva = await this.hasheador.hashear(contrasena);
    const { datosDeSesion, credencial } = this.abrirSesion.preparar();
    const cambiada = await this.accesos.cambiarContrasena({
      usuario,
      tokenHash: sesion.tokenHash,
      contrasenaHashNueva,
      sesion: datosDeSesion,
    });
    return cambiada ? credencial : undefined;
  }
}
