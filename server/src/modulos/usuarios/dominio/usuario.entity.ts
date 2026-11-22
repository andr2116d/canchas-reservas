import type { Celular } from './celular.value-object';
import type { Correo } from './correo.value-object';
import type { DocumentoIdentidad } from './documento-identidad.value-object';
import type { Dorsal } from './dorsal.value-object';
import type { FechaNacimiento } from './fecha-nacimiento.value-object';
import type { NombrePersona } from './nombre-persona.value-object';

export type RolUsuario = 'JUGADOR';
export type EstadoUsuario = 'ACTIVO';

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

interface EstadoCompleto extends DatosDeCuenta {
  id?: number;
  rol: RolUsuario;
  estado: EstadoUsuario;
}

/** Persona con cuenta en La Previa. */
export class Usuario {
  private constructor(private readonly datos: EstadoCompleto) {}

  /** Crea la cuenta de un jugador nuevo: siempre con rol jugador y activa. */
  static registrarJugador(datos: DatosDeCuenta): Usuario {
    return new Usuario({ ...datos, rol: 'JUGADOR', estado: 'ACTIVO' });
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

  get fechaNacimiento(): FechaNacimiento {
    return this.datos.fechaNacimiento;
  }

  get documento(): DocumentoIdentidad {
    return this.datos.documento;
  }

  get correo(): Correo {
    return this.datos.correo;
  }

  get celular(): Celular {
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

  /** Solo los usuarios activos pueden iniciar sesión. */
  estaActivo(): boolean {
    return this.datos.estado === 'ACTIVO';
  }
}
