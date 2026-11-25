import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { Correo } from '../../../compartido/dominio/correo.value-object';
import { ReglasDeCorreo } from './reglas-de-correo';

const reglas = new ReglasDeCorreo('laprevia.pe');

describe('ReglasDeCorreo', () => {
  it.each([
    ['RECEPCIONISTA', 'rosa.quispe@laprevia.pe', true],
    ['ADMINISTRADOR', 'valeria@laprevia.pe', true],
    ['RECEPCIONISTA', 'rosa@gmail.com', false],
    ['JUGADOR', 'jugador@gmail.com', true],
    ['JUGADOR', 'jugador@laprevia.pe', false],
  ] as const)(
    'para %s, %s corresponde al rol: %s',
    (rol, direccion, esperado) => {
      expect(reglas.correspondeAlRol(rol, Correo.crear(direccion))).toBe(
        esperado,
      );
    },
  );

  it('no confunde un subdominio con el dominio corporativo', () => {
    const correo = Correo.crear('alguien@otro.laprevia.pe');

    expect(reglas.correspondeAlRol('JUGADOR', correo)).toBe(true);
    expect(reglas.correspondeAlRol('RECEPCIONISTA', correo)).toBe(false);
  });

  it('pide al jugador un correo personal si usa el dominio del local', () => {
    expect(() =>
      reglas.exigirParaRol('JUGADOR', Correo.crear('ana@laprevia.pe')),
    ).toThrow(
      new ValorInvalidoError(
        'Usa un correo personal: @laprevia.pe es solo para el personal del local.',
      ),
    );
  });

  it('pide al personal un correo del dominio del local', () => {
    expect(() =>
      reglas.exigirParaRol('RECEPCIONISTA', Correo.crear('ana@gmail.com')),
    ).toThrow(new ValorInvalidoError('Usa un correo @laprevia.pe.'));
  });

  it('arma el correo institucional con lo que va antes de la @', () => {
    expect(reglas.institucional(' Rosa.Quispe ').direccion).toBe(
      'rosa.quispe@laprevia.pe',
    );
  });

  it.each(['', 'rosa@otro.pe', 'rosa quispe'])(
    'rechaza «%s» como inicio de un correo institucional',
    (usuario) => {
      expect(() => reglas.institucional(usuario)).toThrow(ValorInvalidoError);
    },
  );
});
