import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { Celular } from '../dominio/celular.value-object';
import { Contrasena } from '../dominio/contrasena.value-object';
import { Correo } from '../dominio/correo.value-object';
import {
  CuentaYaExisteError,
  type DatoUnico,
} from '../dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../dominio/documento-identidad.value-object';
import { NombrePersona } from '../dominio/nombre-persona.value-object';
import { Usuario } from '../dominio/usuario.entity';
import type { UsuarioRepository } from '../dominio/usuario.repository';
import type { HasheadorContrasena } from './hasheador-contrasena.port';

/** Datos tal como los escribe la persona en el formulario de registro. */
export interface DatosRegistroJugador {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string;
  celular: string;
  contrasena: string;
}

export interface JugadorRegistrado {
  id: number;
  nombres: string;
}

/** Crea la cuenta de un jugador nuevo, activa y con rol jugador. */
export class RegistrarJugadorUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasheador: HasheadorContrasena,
  ) {}

  /** Valida todos los datos, comprueba que no estén repetidos y guarda la cuenta. */
  async ejecutar(datos: DatosRegistroJugador): Promise<JugadorRegistrado> {
    const campos = validarDatosDeRegistro(datos);
    await this.verificarQueNoTengaCuenta(campos.numeroDocumento, campos.correo);

    const jugador = Usuario.registrarJugador({
      nombres: campos.nombres,
      apellidos: campos.apellidos,
      documento: campos.numeroDocumento,
      correo: campos.correo,
      celular: campos.celular,
      contrasenaHash: await this.hasheador.hashear(campos.contrasena),
    });
    const id = await this.usuarios.crear(jugador);
    return { id, nombres: jugador.nombres.texto };
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

function validarDatosDeRegistro(datos: DatosRegistroJugador) {
  return validarCampos({
    nombres: () => NombrePersona.crear(datos.nombres, 'nombres'),
    apellidos: () => NombrePersona.crear(datos.apellidos, 'apellidos'),
    numeroDocumento: () =>
      DocumentoIdentidad.crear(datos.tipoDocumento, datos.numeroDocumento),
    correo: () => Correo.crear(datos.correo),
    celular: () => Celular.crear(datos.celular),
    contrasena: () => Contrasena.crear(datos.contrasena),
  });
}
