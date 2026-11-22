const MINUTO = 60 * 1000;
// OWASP sugiere 15 a 30 minutos de inactividad para aplicaciones de bajo riesgo.
const MINUTOS_DE_INACTIVIDAD = 30;
const HORAS_DE_DURACION_MAXIMA = 8;

interface DatosSesion {
  usuarioId: number;
  tokenHash: string;
  ultimaActividadEn: Date;
  expiraEn: Date;
}

/**
 * Sesión iniciada de un usuario. Vence tras 30 minutos sin actividad o a las
 * 8 horas de abrirse, lo que ocurra primero.
 */
export class Sesion {
  private constructor(private readonly datos: DatosSesion) {}

  static abrir(usuarioId: number, tokenHash: string, ahora: Date): Sesion {
    return new Sesion({
      usuarioId,
      tokenHash,
      ultimaActividadEn: ahora,
      expiraEn: new Date(
        ahora.getTime() + HORAS_DE_DURACION_MAXIMA * 60 * MINUTO,
      ),
    });
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
