import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import type {
  AbrirSesionUseCase,
  SesionAbierta,
} from '../../sesiones/api-sesiones';
import { validarVersionLegal } from '../dominio/aceptacion-legal-registro';
import { Celular } from '../dominio/celular.value-object';
import { Contrasena } from '../dominio/contrasena.value-object';
import { Correo } from '../dominio/correo.value-object';
import {
  CuentaYaExisteError,
  type DatoUnico,
} from '../dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../dominio/documento-identidad.value-object';
import { Dorsal } from '../dominio/dorsal.value-object';
import { FechaNacimiento } from '../dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../dominio/nombre-persona.value-object';
import type { ReglasDeCorreo } from '../dominio/reglas-de-correo';
import { Usuario } from '../dominio/usuario.entity';
import type { UsuarioRepository } from '../dominio/usuario.repository';
import type { HasheadorContrasena } from './hasheador-contrasena.port';

/** Datos tal como los escribe la persona en el formulario de registro. */
export interface DatosRegistroJugador {
  nombres: string;
  apellidos: string;
  /** AAAA-MM-DD, como la entrega un campo de fecha del navegador. */
  fechaNacimiento: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string;
  celular: string;
  contrasena: string;
  /** Opcional, del 1 al 99. */
  dorsal?: string;
  versionLegalAceptada: string;
}

export interface JugadorRegistrado {
  id: number;
  nombres: string;
  sesion: SesionAbierta;
}

/** Reloj para validar la edad y reglas del correo según el tipo de cuenta. */
export interface ContextoDelRegistro {
  reloj: Reloj;
  correos: ReglasDeCorreo;
}

/** Crea la cuenta de un jugador nuevo, mayor de edad, activa y con rol jugador. */
export class RegistrarJugadorUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasheador: HasheadorContrasena,
    private readonly abrirSesion: Pick<AbrirSesionUseCase, 'preparar'>,
    private readonly contexto: ContextoDelRegistro,
  ) {}

  /** Valida todos los datos, comprueba que no estén repetidos y guarda la cuenta. */
  async ejecutar(datos: DatosRegistroJugador): Promise<JugadorRegistrado> {
    const campos = validarDatosDeRegistro(datos, this.contexto);
    await this.verificarQueNoTengaCuenta(campos.numeroDocumento, campos.correo);

    const jugador = Usuario.registrarJugador({
      nombres: campos.nombres,
      apellidos: campos.apellidos,
      fechaNacimiento: campos.fechaNacimiento,
      documento: campos.numeroDocumento,
      correo: campos.correo,
      celular: campos.celular,
      dorsal: campos.dorsal,
      contrasenaHash: await this.hasheador.hashear(campos.contrasena),
    });
    const { datosDeSesion, credencial } = this.abrirSesion.preparar();
    const id = await this.usuarios.crear(jugador, {
      sesion: datosDeSesion,
      aceptacion: {
        version: campos.versionLegalAceptada,
        fecha: this.contexto.reloj.ahora(),
        canal: 'web',
      },
    });
    return { id, nombres: jugador.nombres.texto, sesion: credencial };
  }

  private async verificarQueNoTengaCuenta(
    documento: DocumentoIdentidad,
    correo: Correo,
  ): Promise<void> {
    const [documentoUsado, correoUsado] = await Promise.all([
      this.usuarios.existeConDocumento(documento),
      this.usuarios.existeConCorreo(correo),
    ]);
    const repetidos: DatoUnico[] = [];
    if (documentoUsado) repetidos.push('numeroDocumento');
    if (correoUsado) repetidos.push('correo');
    if (repetidos.length > 0) throw new CuentaYaExisteError(repetidos);
  }
}

function validarDatosDeRegistro(
  datos: DatosRegistroJugador,
  { reloj, correos }: ContextoDelRegistro,
) {
  return validarCampos({
    nombres: () => NombrePersona.crear(datos.nombres, 'nombres'),
    apellidos: () => NombrePersona.crear(datos.apellidos, 'apellidos'),
    fechaNacimiento: () =>
      FechaNacimiento.crear(datos.fechaNacimiento, reloj.ahora()),
    numeroDocumento: () =>
      DocumentoIdentidad.crear(datos.tipoDocumento, datos.numeroDocumento),
    correo: () => correos.exigirParaRol('JUGADOR', Correo.crear(datos.correo)),
    celular: () => Celular.crear(datos.celular),
    contrasena: () => Contrasena.crear(datos.contrasena),
    dorsal: () => Dorsal.crearOpcional(datos.dorsal),
    versionLegalAceptada: () => validarVersionLegal(datos.versionLegalAceptada),
  });
}
