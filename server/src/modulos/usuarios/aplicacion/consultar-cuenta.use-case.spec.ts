import { unJugadorValido } from '../../../../test/fabricas/datos-registro-jugador';
import type { Contrasena } from '../dominio/contrasena.value-object';
import { EnMemoriaUsuarioRepository } from '../../../../test/dobles/en-memoria-usuario.repository';
import { ConsultarCuentaUseCase } from './consultar-cuenta.use-case';
import { RegistrarJugadorUseCase } from './registrar-jugador.use-case';

const hasheador = {
  hashear: (contrasena: Contrasena) => Promise.resolve(contrasena.texto),
};

describe('ConsultarCuentaUseCase', () => {
  it('devuelve los nombres del usuario de la sesión', async () => {
    const usuarios = new EnMemoriaUsuarioRepository();
    const { id } = await new RegistrarJugadorUseCase(
      usuarios,
      hasheador,
    ).ejecutar(unJugadorValido());

    const cuenta = await new ConsultarCuentaUseCase(usuarios).ejecutar(id);

    expect(cuenta).toEqual({ nombres: 'Valeria' });
  });

  it('no devuelve nada si el usuario no existe', async () => {
    const cuenta = await new ConsultarCuentaUseCase(
      new EnMemoriaUsuarioRepository(),
    ).ejecutar(99);

    expect(cuenta).toBeUndefined();
  });
});
