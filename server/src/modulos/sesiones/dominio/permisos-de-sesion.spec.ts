import { puedeAcceder } from './permisos-de-sesion';

describe('Permisos de sesión', () => {
  it.each([
    ['ADMINISTRADOR', 'panel:administracion'],
    ['RECEPCIONISTA', 'panel:recepcion'],
    ['JUGADOR', 'panel:jugador'],
  ] as const)(
    'permite a %s abrir su panel y deniega los demás',
    (rol, propio) => {
      const acciones = [
        'panel:administracion',
        'panel:recepcion',
        'panel:jugador',
      ] as const;
      for (const accion of acciones) {
        expect(
          puedeAcceder({ rol, requiereCambiarContrasena: false }, accion),
        ).toBe(accion === propio);
      }
    },
  );

  it('deniega rutas privadas que aún no declaran un permiso', () => {
    expect(
      puedeAcceder(
        { rol: 'ADMINISTRADOR', requiereCambiarContrasena: false },
        undefined,
      ),
    ).toBe(false);
  });

  it('restringe una sesión temporal al cambio y la consulta de sesión', () => {
    const acceso = {
      rol: 'ADMINISTRADOR',
      requiereCambiarContrasena: true,
    } as const;

    expect(puedeAcceder(acceso, 'panel:administracion')).toBe(false);
    expect(puedeAcceder(acceso, 'personal:gestionar-recepcionistas')).toBe(
      false,
    );
    expect(puedeAcceder(acceso, 'sesion:cambiar-contrasena-temporal')).toBe(
      true,
    );
    expect(puedeAcceder(acceso, 'sesion:consultar')).toBe(true);
  });

  it('permite el alta de recepcionistas exclusivamente a administración', () => {
    expect(
      puedeAcceder(
        { rol: 'ADMINISTRADOR', requiereCambiarContrasena: false },
        'personal:gestionar-recepcionistas',
      ),
    ).toBe(true);
    expect(
      puedeAcceder(
        { rol: 'RECEPCIONISTA', requiereCambiarContrasena: false },
        'personal:gestionar-recepcionistas',
      ),
    ).toBe(false);
    expect(
      puedeAcceder(
        { rol: 'JUGADOR', requiereCambiarContrasena: false },
        'personal:gestionar-recepcionistas',
      ),
    ).toBe(false);
  });

  it('deniega el cambio temporal a una cuenta que completó el primer acceso', () => {
    expect(
      puedeAcceder(
        { rol: 'ADMINISTRADOR', requiereCambiarContrasena: false },
        'sesion:cambiar-contrasena-temporal',
      ),
    ).toBe(false);
  });
});
