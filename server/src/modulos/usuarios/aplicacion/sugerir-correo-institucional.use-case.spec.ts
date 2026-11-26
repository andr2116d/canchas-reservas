import { Correo } from '../../../compartido/dominio/correo.value-object';
import { ReglasDeCorreo } from '../dominio/reglas-de-correo';
import { SugerirCorreoInstitucionalUseCase } from './sugerir-correo-institucional.use-case';

function preparar(ocupados: string[] = []) {
  const usuarios = {
    existeConCorreo: (correo: Correo) =>
      Promise.resolve(ocupados.includes(correo.direccion)),
  };
  return new SugerirCorreoInstitucionalUseCase(
    usuarios,
    new ReglasDeCorreo('laprevia.pe'),
  );
}

describe('SugerirCorreoInstitucionalUseCase', () => {
  it('sugiere el primer nombre y el primer apellido', async () => {
    await expect(
      preparar().ejecutar('Rosa María', 'Quispe Lozano'),
    ).resolves.toEqual({ usuarioDeCorreo: 'rosa.quispe' });
  });

  it('agrega un número mientras el correo ya exista', async () => {
    const sugerir = preparar([
      'rosa.quispe@laprevia.pe',
      'rosa.quispe2@laprevia.pe',
    ]);

    await expect(sugerir.ejecutar('Rosa', 'Quispe')).resolves.toEqual({
      usuarioDeCorreo: 'rosa.quispe3',
    });
  });

  it('no sugiere nada si los nombres no tienen letras válidas', async () => {
    await expect(preparar().ejecutar('—', '—')).resolves.toBeUndefined();
  });
});
