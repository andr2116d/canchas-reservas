import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { unJugadorValido } from '../../../../test/fabricas/datos-registro-jugador';
import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import type { Contrasena } from '../dominio/contrasena.value-object';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { EnMemoriaUsuarioRepository } from '../../../../test/dobles/en-memoria-usuario.repository';
import type { HasheadorContrasena } from './hasheador-contrasena.port';
import { RegistrarJugadorUseCase } from './registrar-jugador.use-case';

/** Hash predecible para comprobar que se guarda el hash y no el texto. */
class HasheadorDePrueba implements HasheadorContrasena {
  hashear(contrasena: Contrasena): Promise<string> {
    return Promise.resolve(`hash(${contrasena.texto})`);
  }
}

function prepararRegistro() {
  const usuarios = new EnMemoriaUsuarioRepository();
  const registrar = new RegistrarJugadorUseCase(
    usuarios,
    new HasheadorDePrueba(),
    new RelojDePrueba(),
  );
  return { usuarios, registrar };
}

async function capturarError(promesa: Promise<unknown>) {
  return promesa.then(
    () => {
      throw new Error('Se esperaba un error');
    },
    (error: unknown) => error,
  );
}

describe('RegistrarJugadorUseCase', () => {
  it('crea al usuario con rol jugador y estado activo', async () => {
    const { usuarios, registrar } = prepararRegistro();

    await registrar.ejecutar(unJugadorValido());

    const [guardado] = usuarios.todos();
    expect(guardado.rol).toBe('JUGADOR');
    expect(guardado.estado).toBe('ACTIVO');
  });

  it('devuelve el id y los nombres del jugador para abrir su sesión', async () => {
    const { registrar } = prepararRegistro();

    const jugador = await registrar.ejecutar(unJugadorValido());

    expect(jugador).toEqual({ id: 1, nombres: 'Valeria' });
  });

  it('guarda el hash de la contraseña, nunca el texto', async () => {
    const { usuarios, registrar } = prepararRegistro();

    await registrar.ejecutar(unJugadorValido({ contrasena: 'pichanga10' }));

    expect(usuarios.todos()[0].contrasenaHash).toBe('hash(pichanga10)');
  });

  it('rechaza un documento que ya tiene cuenta', async () => {
    const { registrar } = prepararRegistro();
    await registrar.ejecutar(unJugadorValido());

    const error = await capturarError(
      registrar.ejecutar(unJugadorValido({ correo: 'otro@gmail.com' })),
    );

    expect(error).toBeInstanceOf(CuentaYaExisteError);
    expect((error as CuentaYaExisteError).errores).toEqual({
      numeroDocumento: 'Ya existe una cuenta con este documento.',
    });
  });

  it('rechaza un correo que ya tiene cuenta, aunque cambien las mayúsculas', async () => {
    const { registrar } = prepararRegistro();
    await registrar.ejecutar(unJugadorValido());

    const error = await capturarError(
      registrar.ejecutar(
        unJugadorValido({
          numeroDocumento: '11223344',
          correo: 'Valeria.Leon@Gmail.com',
        }),
      ),
    );

    expect((error as CuentaYaExisteError).errores).toEqual({
      correo: 'Ya existe una cuenta con este correo.',
    });
  });

  it('informa los dos datos cuando el documento y el correo ya tienen cuenta', async () => {
    const { registrar } = prepararRegistro();
    await registrar.ejecutar(unJugadorValido());

    const error = await capturarError(registrar.ejecutar(unJugadorValido()));

    expect(Object.keys((error as CuentaYaExisteError).errores)).toEqual([
      'numeroDocumento',
      'correo',
    ]);
  });

  it('guarda la fecha de nacimiento del jugador', async () => {
    const { usuarios, registrar } = prepararRegistro();

    await registrar.ejecutar(
      unJugadorValido({ fechaNacimiento: '1998-05-14' }),
    );

    expect(usuarios.todos()[0].fechaNacimiento.fecha).toBe('1998-05-14');
  });

  it('guarda el dorsal elegido', async () => {
    const { usuarios, registrar } = prepararRegistro();

    await registrar.ejecutar(unJugadorValido({ dorsal: '10' }));

    expect(usuarios.todos()[0].dorsal?.numero).toBe(10);
  });

  it('permite registrarse sin dorsal', async () => {
    const { usuarios, registrar } = prepararRegistro();

    await registrar.ejecutar(unJugadorValido({ dorsal: undefined }));

    expect(usuarios.todos()[0].dorsal).toBeUndefined();
  });

  it('rechaza a un menor de 18 años y no guarda nada', async () => {
    const { usuarios, registrar } = prepararRegistro();

    const error = await capturarError(
      registrar.ejecutar(unJugadorValido({ fechaNacimiento: '2010-01-01' })),
    );

    expect((error as ReglaInvalidaError).errores).toEqual({
      fechaNacimiento: 'Debes tener al menos 18 años para crear tu cuenta.',
    });
    expect(usuarios.todos()).toHaveLength(0);
  });

  it('reúne los errores de todos los campos y no guarda nada', async () => {
    const { usuarios, registrar } = prepararRegistro();

    const error = await capturarError(
      registrar.ejecutar(
        unJugadorValido({
          numeroDocumento: '4567891A',
          celular: '044123456',
          contrasena: 'sinnumero',
        }),
      ),
    );

    expect(error).toBeInstanceOf(ReglaInvalidaError);
    expect((error as ReglaInvalidaError).errores).toEqual({
      numeroDocumento: 'El DNI solo debe contener números.',
      celular: 'El celular debe empezar con 9.',
      contrasena: 'La contraseña debe incluir al menos un número.',
    });
    expect(usuarios.todos()).toHaveLength(0);
  });
});
