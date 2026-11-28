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

  it.each([
    ['ADMINISTRADOR', true],
    ['RECEPCIONISTA', true],
    ['JUGADOR', false],
  ] as const)(
    'la agenda de turnos la consulta el personal: %s → %s',
    (rol, permitido) => {
      expect(
        puedeAcceder(
          { rol, requiereCambiarContrasena: false },
          'agenda:consultar',
        ),
      ).toBe(permitido);
    },
  );

  it('al omitir el cambio, abre el panel del rol y sigue permitiendo cambiar la contraseña', () => {
    const acceso = {
      rol: 'RECEPCIONISTA',
      requiereCambiarContrasena: true,
      cambioOmitido: true,
    } as const;

    expect(puedeAcceder(acceso, 'panel:recepcion')).toBe(true);
    expect(puedeAcceder(acceso, 'panel:administracion')).toBe(false);
    expect(puedeAcceder(acceso, 'sesion:cambiar-contrasena-temporal')).toBe(
      true,
    );
  });

  it.each(['ADMINISTRADOR', 'RECEPCIONISTA', 'JUGADOR'] as const)(
    'solo recepción puede reservar en mostrador (%s)',
    (rol) => {
      expect(
        puedeAcceder(
          { rol, requiereCambiarContrasena: false },
          'reservas:gestionar-en-recepcion',
        ),
      ).toBe(rol === 'RECEPCIONISTA');
    },
  );

  it.each(['ADMINISTRADOR', 'RECEPCIONISTA', 'JUGADOR'] as const)(
    'el permiso para configurar la llegada es independiente del check-in (%s)',
    (rol) => {
      const acceso = { rol, requiereCambiarContrasena: false };
      expect(puedeAcceder(acceso, 'ventana-de-llegada:gestionar')).toBe(
        rol === 'ADMINISTRADOR',
      );
      expect(puedeAcceder(acceso, 'reservas:hacer-check-in')).toBe(
        rol === 'RECEPCIONISTA',
      );
    },
  );

  it('ignora la omisión si la contraseña ya no es temporal', () => {
    expect(
      puedeAcceder(
        {
          rol: 'RECEPCIONISTA',
          requiereCambiarContrasena: false,
          cambioOmitido: true,
        },
        'sesion:cambiar-contrasena-temporal',
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

  describe('con los datos sin confirmar', () => {
    const sinDatos = {
      rol: 'ADMINISTRADOR' as const,
      requiereCambiarContrasena: true,
      cambioOmitido: true,
      requiereCompletarDatos: true,
    };

    it('solo puede consultar su sesión y completar sus datos', () => {
      expect(puedeAcceder(sinDatos, 'sesion:consultar')).toBe(true);
      expect(puedeAcceder(sinDatos, 'cuenta:completar-datos')).toBe(true);
    });

    it('no abre su panel ni cambia la contraseña hasta completarlos', () => {
      expect(puedeAcceder(sinDatos, 'panel:administracion')).toBe(false);
      expect(puedeAcceder(sinDatos, 'cuenta:propia')).toBe(false);
      expect(puedeAcceder(sinDatos, 'sesion:cambiar-contrasena-temporal')).toBe(
        false,
      );
    });

    it('con los datos confirmados ya no puede volver a completarlos', () => {
      expect(
        puedeAcceder(
          { rol: 'RECEPCIONISTA', requiereCambiarContrasena: false },
          'cuenta:completar-datos',
        ),
      ).toBe(false);
    });
  });
});
