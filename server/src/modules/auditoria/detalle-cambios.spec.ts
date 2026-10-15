import { detalleCambios } from './detalle-cambios';

describe('detalleCambios', () => {
  it('incluye solo los campos que cambiaron', () => {
    const anterior = {
      nombres: 'Ana',
      telefono: '911111111',
      correo: 'ana@mail.com',
    };
    const nuevo = {
      nombres: 'Ana',
      telefono: '922222222',
      correo: 'ana@mail.com',
    };

    expect(detalleCambios(anterior, nuevo)).toEqual({
      anterior: { telefono: '911111111' },
      nuevo: { telefono: '922222222' },
    });
  });

  it('nunca guarda passwordHash ni contrasena aunque cambien', () => {
    const detalle = detalleCambios(
      { nombres: 'Ana', passwordHash: 'hash-viejo', contrasena: 'vieja' },
      { nombres: 'Ana María', passwordHash: 'hash-nuevo', contrasena: 'nueva' },
    );

    expect(detalle).toEqual({
      anterior: { nombres: 'Ana' },
      nuevo: { nombres: 'Ana María' },
    });
    expect(JSON.stringify(detalle)).not.toMatch(/hash|vieja|nueva/);
  });

  it('devuelve null si solo cambió la contraseña', () => {
    expect(
      detalleCambios({ passwordHash: 'a' }, { passwordHash: 'b' }),
    ).toBeNull();
  });

  it('devuelve null si no cambió nada', () => {
    expect(detalleCambios({ nombres: 'Ana' }, { nombres: 'Ana' })).toBeNull();
  });

  it('ignora los campos que no vienen en el nuevo', () => {
    expect(
      detalleCambios(
        { nombres: 'Ana', telefono: '911111111' },
        { telefono: undefined },
      ),
    ).toBeNull();
  });

  it('compara fechas por valor', () => {
    const anterior = { fecha: new Date('2026-10-20T18:00:00Z') };

    expect(
      detalleCambios(anterior, { fecha: new Date('2026-10-20T18:00:00Z') }),
    ).toBeNull();
    expect(
      detalleCambios(anterior, { fecha: new Date('2026-10-21T18:00:00Z') }),
    ).toEqual({
      anterior: { fecha: '2026-10-20T18:00:00.000Z' },
      nuevo: { fecha: '2026-10-21T18:00:00.000Z' },
    });
  });

  it('registra el paso de un valor a null', () => {
    expect(detalleCambios({ apellidos: 'Pérez' }, { apellidos: null })).toEqual(
      {
        anterior: { apellidos: 'Pérez' },
        nuevo: { apellidos: null },
      },
    );
  });
});
