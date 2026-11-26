import { VersionesLeidas } from './versiones-leidas';

describe('VersionesLeidas', () => {
  it('devuelve la versión con que se leyó cada entidad', () => {
    const versiones = new VersionesLeidas<object>();
    const una = versiones.recordar({}, 3);
    const otra = versiones.recordar({}, 7);

    expect([versiones.de(una), versiones.de(otra)]).toEqual([3, 7]);
  });

  it('se niega a dar una versión de algo que no se leyó de la base', () => {
    expect(() => new VersionesLeidas<object>().de({})).toThrow(
      'Solo se guarda una entidad leída de la base.',
    );
  });
});
