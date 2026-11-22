const MINUTO = 60 * 1000;
// OWASP sugiere 15 a 30 minutos de inactividad para aplicaciones de bajo riesgo.
const MINUTOS_DE_INACTIVIDAD = 30;
const HORAS_DE_DURACION_MAXIMA = 8;

/** Datos de una sesión nueva antes de asociarla a un usuario. */
export interface SesionNueva {
  tokenHash: string;
  ultimaActividadEn: Date;
  expiraEn: Date;
}

interface DatosSesion extends SesionNueva {
  usuarioId: number;
}

/**
 * Sesión iniciada de un usuario. Vence tras 30 minutos sin actividad o a las
 * 8 horas de abrirse, lo que ocurra primero.
 */
export class Sesion {
  private constructor(private readonly datos: DatosSesion) {}

  /** Calcula la vigencia de la sesión que se va a guardar. */
  static preparar(tokenHash: string, ahora: Date): SesionNueva {
    return {
      tokenHash,
      ultimaActividadEn: ahora,
      expiraEn: new Date(
        ahora.getTime() + HORAS_DE_DURACION_MAXIMA * 60 * MINUTO,
      ),
    };
  }

  /** Asocia una sesión preparada a un usuario existente. */
  static abrir(usuarioId: number, sesion: SesionNueva): Sesion {
    return new Sesion({ ...sesion, usuarioId });
  }

  /** Reconstruye una sesión guardada. */
  static restaurar(datos: DatosSesion): Sesion {
    return new Sesion(datos);
  }

  get usuarioId(): number {
    return this.datos.usuarioId;
  }

  get tokenHash(): string {
    return this.datos.tokenHash;
  }

  get ultimaActividadEn(): Date {
    return this.datos.ultimaActividadEn;
  }

  get expiraEn(): Date {
    return this.datos.expiraEn;
  }

  estaVigente(ahora: Date): boolean {
    const inactiva =
      ahora.getTime() - this.datos.ultimaActividadEn.getTime() >=
      MINUTOS_DE_INACTIVIDAD * MINUTO;
    return !inactiva && ahora < this.datos.expiraEn;
  }

  /** Devuelve la misma sesión con la actividad renovada al momento indicado. */
  registrarActividad(ahora: Date): Sesion {
    return new Sesion({ ...this.datos, ultimaActividadEn: ahora });
  }
}
