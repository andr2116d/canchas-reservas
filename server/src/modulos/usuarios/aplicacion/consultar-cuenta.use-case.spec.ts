import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { unJugadorValido } from '../../../../test/fabricas/datos-registro-jugador';
import type { Contrasena } from '../dominio/contrasena.value-object';
import { EnMemoriaUsuarioRepository } from '../../../../test/dobles/en-memoria-usuario.repository';
import { AbrirSesionUseCase } from '../../sesiones/api-sesiones';
import { ReglasDeCorreo } from '../dominio/reglas-de-correo';
import { ConsultarCuentaUseCase } from './consultar-cuenta.use-case';
import { RegistrarJugadorUseCase } from './registrar-jugador.use-case';

const hasheador = {
  hashear: (contrasena: Contrasena) => Promise.resolve(contrasena.texto),
};

describe('ConsultarCuentaUseCase', () => {
  it('devuelve los nombres del usuario de la sesión', async () => {
    const usuarios = new EnMemoriaUsuarioRepository();
    const reloj = new RelojDePrueba();
    const abrirSesion = new AbrirSesionUseCase(
      new EnMemoriaSesionRepository(),
      new GeneradorTokenDePrueba(),
      reloj,
    );
    const { id } = await new RegistrarJugadorUseCase(
      usuarios,
      hasheador,
      abrirSesion,
      { reloj, correos: new ReglasDeCorreo('laprevia.pe') },
    ).ejecutar(unJugadorValido());

    const cuenta = await new ConsultarCuentaUseCase(usuarios).ejecutar(id);

    expect(cuenta).toMatchObject({ nombres: 'Valeria', rol: 'JUGADOR' });
  });

  it('no devuelve nada si el usuario no existe', async () => {
    const cuenta = await new ConsultarCuentaUseCase(
      new EnMemoriaUsuarioRepository(),
    ).ejecutar(99);

    expect(cuenta).toBeUndefined();
  });
});
import { EnMemoriaSesionRepository } from '../../../../test/dobles/en-memoria-sesion.repository';
import { GeneradorTokenDePrueba } from '../../../../test/dobles/generador-token-de-prueba';
