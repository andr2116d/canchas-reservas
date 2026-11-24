import type { ContextoDeCuentas } from './contexto-de-cuentas';
import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';
import { temporalVencida } from '../dominio/contrasena-temporal';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import type {
  AbrirSesionUseCase,
  SesionAbierta,
} from '../../sesiones/api-sesiones';
import type { AccesoRepository } from '../dominio/acceso.repository';
import { Correo } from '../dominio/correo.value-object';

export interface DatosInicioSesion {
  correo: string;
  contrasena: string;
  /** Resumen del navegador desde el que se entra. */
  dispositivo?: string;
}

export type VerificarContrasena = (
  texto: string,
  hash?: string,
) => Promise<boolean>;

export type ResultadoInicioSesion =
  | {
      tipo: 'sesion-abierta';
      rol: RolUsuario;
      requiereCompletarDatos: boolean;
      requiereCambiarContrasena: boolean;
      contrasenaTemporalVenceEn?: Date;
      sesion: SesionAbierta;
    }
  | { tipo: 'credenciales-invalidas' }
  | { tipo: 'cuenta-inactiva' }
  | { tipo: 'contrasena-temporal-vencida' };

/** Comprueba credenciales y registra la apertura de sesión. */
export class IniciarSesionUseCase {
  constructor(
    private readonly accesos: Pick<
      AccesoRepository,
      'buscarPorCorreo' | 'registrarInicio'
    >,
    private readonly verificarContrasena: VerificarContrasena,
    private readonly abrirSesion: AbrirSesionUseCase,
    private readonly contexto: ContextoDeCuentas,
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
      !this.contexto.correos.correspondeAlRol(usuario.rol, correo)
    ) {
      return { tipo: 'credenciales-invalidas' };
    }
    if (usuario.estado !== 'ACTIVO') return { tipo: 'cuenta-inactiva' };
    if (
      usuario.requiereCambiarContrasena &&
      temporalVencida(
        usuario.contrasenaTemporalVenceEn,
        this.contexto.reloj.ahora(),
      )
    ) {
      return { tipo: 'contrasena-temporal-vencida' };
    }

    const { datosDeSesion, credencial } = this.abrirSesion.preparar(
      datos.dispositivo,
    );
    if (
      !(await this.accesos.registrarInicio({ usuario, sesion: datosDeSesion }))
    ) {
      return { tipo: 'credenciales-invalidas' };
    }
    return {
      tipo: 'sesion-abierta',
      rol: usuario.rol,
      requiereCompletarDatos: usuario.requiereCompletarDatos,
      requiereCambiarContrasena: usuario.requiereCambiarContrasena,
      contrasenaTemporalVenceEn: usuario.contrasenaTemporalVenceEn,
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
