/**
 * Recuerda la versión con que se leyó cada entidad. Al guardar, la escritura solo
 * se aplica si la fila sigue en esa versión: así un cambio hecho desde otro
 * dispositivo entre la lectura y el guardado no se pisa en silencio.
 */
export class VersionesLeidas<Entidad extends object> {
  private readonly versiones = new WeakMap<Entidad, number>();

  recordar(entidad: Entidad, version: number): Entidad {
    this.versiones.set(entidad, version);
    return entidad;
  }

  de(entidad: Entidad): number {
    const version = this.versiones.get(entidad);
    if (version === undefined)
      throw new Error('Solo se guarda una entidad leída de la base.');
    return version;
  }
}
