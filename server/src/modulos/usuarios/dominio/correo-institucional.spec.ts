import { sugerirUsuarioDeCorreo } from './correo-institucional';

describe('sugerirUsuarioDeCorreo', () => {
  it('une el primer nombre y el primer apellido en minúscula', () => {
    expect(sugerirUsuarioDeCorreo('Rosa María', 'Quispe Lozano', 1)).toBe(
      'rosa.quispe',
    );
  });

  it('quita tildes, eñes y caracteres que no van en un correo', () => {
    expect(sugerirUsuarioDeCorreo('Íñigo', "D'Ávila Núñez", 1)).toBe(
      'inigo.davila',
    );
  });

  it('agrega un número desde el segundo intento', () => {
    expect(sugerirUsuarioDeCorreo('Rosa', 'Quispe', 2)).toBe('rosa.quispe2');
    expect(sugerirUsuarioDeCorreo('Rosa', 'Quispe', 3)).toBe('rosa.quispe3');
  });

  it('usa solo el nombre si el apellido no deja letras válidas', () => {
    expect(sugerirUsuarioDeCorreo('Rosa', '—', 1)).toBe('rosa');
  });

  it('no sugiere nada si no hay letras válidas', () => {
    expect(sugerirUsuarioDeCorreo('—', '—', 1)).toBeUndefined();
  });
});
