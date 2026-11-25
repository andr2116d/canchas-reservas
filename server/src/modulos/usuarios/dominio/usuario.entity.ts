import type {
  EstadoUsuario,
  RolUsuario,
} from '../../../compartido/dominio/rol-usuario';
import type { Celular } from './celular.value-object';
import type { Correo } from '../../../compartido/dominio/correo.value-object';
import type { DocumentoIdentidad } from '../../../compartido/dominio/documento-identidad.value-object';
import type { Dorsal } from './dorsal.value-object';
import type { FechaNacimiento } from './fecha-nacimiento.value-object';
import type { NombrePersona } from '../../../compartido/dominio/nombre-persona.value-object';

/** Datos personales y de acceso que se piden al crear una cuenta. */
export interface DatosDeCuenta {
  nombres: NombrePersona;
  apellidos: NombrePersona;
  fechaNacimiento: FechaNacimiento;
  documento: DocumentoIdentidad;
  correo: Correo;
  celular: Celular;
  contrasenaHash: string;
  /** Opcional: el jugador puede no elegir dorsal. */
  dorsal?: Dorsal;
}

type DatosDeJugador = 'fechaNacimiento' | 'documento' | 'celular';
type DatosDeUsuario = Omit<DatosDeCuenta, DatosDeJugador> &
  Partial<Pick<DatosDeCuenta, DatosDeJugador>>;

export interface EstadoCompleto extends DatosDeUsuario {
  id?: number;
  rol: RolUsuario;
  estado: EstadoUsuario;
  requiereCambiarContrasena?: boolean;
  contrasenaTemporalVenceEn?: Date;
  /** Cuándo el personal completó o confirmó sus datos. */
  datosConfirmadosEn?: Date;
  /** Cuándo pasó de DNI a carné de extranjería o al revés; solo una vez. */
  documentoCambiadoEn?: Date;
}

/** Persona con cuenta en La Previa. */
export class Usuario {
  private constructor(private readonly datos: EstadoCompleto) {}

  /** Crea la cuenta de un jugador nuevo: siempre con rol jugador y activa. */
  static registrarJugador(datos: DatosDeCuenta): Usuario {
    return new Usuario({ ...datos, rol: 'JUGADOR', estado: 'ACTIVO' });
  }

  /** Crea la cuenta de una recepcionista: activa y con una contraseña temporal que debe cambiar. */
  static registrarRecepcionista(
    datos: Omit<DatosDeCuenta, 'dorsal'>,
    contrasenaTemporalVenceEn: Date,
  ): Usuario {
    return new Usuario({
      ...datos,
      rol: 'RECEPCIONISTA',
      estado: 'ACTIVO',
      requiereCambiarContrasena: true,
      contrasenaTemporalVenceEn,
    });
  }

  static registrarPersonal(
    datos: Pick<
      DatosDeCuenta,
      'nombres' | 'apellidos' | 'correo' | 'contrasenaHash'
    >,
    rol: Exclude<RolUsuario, 'JUGADOR'>,
    contrasenaTemporalVenceEn: Date,
  ): Usuario {
    return new Usuario({
      ...datos,
      rol,
      estado: 'ACTIVO',
      requiereCambiarContrasena: true,
      contrasenaTemporalVenceEn,
    });
  }

  /** Reconstruye un usuario que ya está guardado. */
  static restaurar(datos: EstadoCompleto & { id: number }): Usuario {
    return new Usuario(datos);
  }

  get id(): number | undefined {
    return this.datos.id;
  }

  get nombres(): NombrePersona {
    return this.datos.nombres;
  }

  get apellidos(): NombrePersona {
    return this.datos.apellidos;
  }

  get fechaNacimiento(): FechaNacimiento | undefined {
    return this.datos.fechaNacimiento;
  }

  get documento(): DocumentoIdentidad | undefined {
    return this.datos.documento;
  }

  get correo(): Correo {
    return this.datos.correo;
  }

  get celular(): Celular | undefined {
    return this.datos.celular;
  }

  get dorsal(): Dorsal | undefined {
    return this.datos.dorsal;
  }

  get contrasenaHash(): string {
    return this.datos.contrasenaHash;
  }

  get rol(): RolUsuario {
    return this.datos.rol;
  }

  get estado(): EstadoUsuario {
    return this.datos.estado;
  }

  get requiereCambiarContrasena(): boolean {
    return this.datos.requiereCambiarContrasena ?? false;
  }

  /** Hasta cuándo sirve la contraseña temporal; nada si no es temporal. */
  get contrasenaTemporalVenceEn(): Date | undefined {
    return this.datos.contrasenaTemporalVenceEn;
  }

  get datosConfirmadosEn(): Date | undefined {
    return this.datos.datosConfirmadosEn;
  }

  get documentoCambiadoEn(): Date | undefined {
    return this.datos.documentoCambiadoEn;
  }

  /** Copia del estado guardado, para reconstruirlo con algunos datos cambiados. */
  get estadoGuardado(): EstadoCompleto {
    return { ...this.datos };
  }

  /** Solo los usuarios activos pueden iniciar sesión. */
  estaActivo(): boolean {
    return this.datos.estado === 'ACTIVO';
  }
}
