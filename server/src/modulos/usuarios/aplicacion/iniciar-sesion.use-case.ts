import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import type {
  AbrirSesionUseCase,
  SesionAbierta,
} from '../../sesiones/api-sesiones';
import type { AccesoRepository } from '../dominio/acceso.repository';
import { Correo } from '../dominio/correo.value-object';
import type { ReglasDeCorreo } from '../dominio/reglas-de-correo';

export interface DatosInicioSesion {
  correo: string;
  contrasena: string;
}

export type VerificarContrasena = (
  texto: string,
  hash?: string,
) => Promise<boolean>;

export type ResultadoInicioSesion =
  | {
      tipo: 'sesion-abierta';
      rol: RolUsuario;
      requiereCambiarContrasena: boolean;
      sesion: SesionAbierta;
    }
  | { tipo: 'credenciales-invalidas' }
  | { tipo: 'cuenta-inactiva' };

/** Comprueba credenciales y registra la apertura de sesión. */
export class IniciarSesionUseCase {
  constructor(
    private readonly accesos: Pick<
      AccesoRepository,
      'buscarPorCorreo' | 'registrarInicio'
    >,
    private readonly verificarContrasena: VerificarContrasena,
    private readonly abrirSesion: AbrirSesionUseCase,
    private readonly correos: ReglasDeCorreo,
  ) {}

  async ejecutar(datos: DatosInicioSesion): Promise<ResultadoInicioSesion> {
    const correo = leerCorreo(datos.correo);
    const usuario = correo && (await this.accesos.buscarPorCorreo(correo));
    const valida = await this.verificarContrasena(
      datos.contrasena,
      usuario?.contrasenaHash,
    );
    if (
      !valida ||
      !usuario ||
      !correo ||
      !this.correos.correspondeAlRol(usuario.rol, correo)
    ) {
      return { tipo: 'credenciales-invalidas' };
    }
    if (usuario.estado !== 'ACTIVO') return { tipo: 'cuenta-inactiva' };

    const { datosDeSesion, credencial } = this.abrirSesion.preparar();
    if (
      !(await this.accesos.registrarInicio({ usuario, sesion: datosDeSesion }))
    ) {
      return { tipo: 'credenciales-invalidas' };
    }
    return {
      tipo: 'sesion-abierta',
      rol: usuario.rol,
      requiereCambiarContrasena: usuario.requiereCambiarContrasena,
      sesion: credencial,
    };
  }
}

function leerCorreo(direccion: string): Correo | undefined {
  try {
    return Correo.crear(direccion);
  } catch (error) {
    if (!(error instanceof ValorInvalidoError)) throw error;
    return undefined;
  }
}
