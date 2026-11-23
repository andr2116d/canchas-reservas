import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { unJugadorValido } from '../../../../test/fabricas/datos-registro-jugador';
import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { AbrirSesionUseCase } from '../../sesiones/api-sesiones';
import type { Contrasena } from '../dominio/contrasena.value-object';
import { Celular } from '../dominio/celular.value-object';
import { Correo } from '../dominio/correo.value-object';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../dominio/documento-identidad.value-object';
import { FechaNacimiento } from '../dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../dominio/nombre-persona.value-object';
import { Usuario } from '../dominio/usuario.entity';
import { ReglasDeCorreo } from '../dominio/reglas-de-correo';
import { EnMemoriaUsuarioRepository } from '../../../../test/dobles/en-memoria-usuario.repository';
import { EnMemoriaSesionRepository } from '../../../../test/dobles/en-memoria-sesion.repository';
import { GeneradorTokenDePrueba } from '../../../../test/dobles/generador-token-de-prueba';
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
  const sesiones = new EnMemoriaSesionRepository();
  const reloj = new RelojDePrueba();
  const registrar = new RegistrarJugadorUseCase(
    usuarios,
    new HasheadorDePrueba(),
    new AbrirSesionUseCase(sesiones, new GeneradorTokenDePrueba(), reloj),
    { reloj, correos: new ReglasDeCorreo('laprevia.pe') },
  );
  return { usuarios, registrar };
}

/** Datos ya validados del jugador de la fábrica, para crear cuentas directamente. */
function datosDeDominio() {
  return {
    nombres: NombrePersona.crear('Valeria', 'nombres'),
    apellidos: NombrePersona.crear('León', 'apellidos'),
    fechaNacimiento: FechaNacimiento.restaurar('1998-05-14'),
    documento: DocumentoIdentidad.crear('DNI', '45678912'),
    correo: Correo.crear('valeria@gmail.com'),
    celular: Celular.crear('987654321'),
    contrasenaHash: 'hash',
  };
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

  it('devuelve los nombres y la credencial de la sesión del jugador registrado', async () => {
    const { registrar } = prepararRegistro();

    const jugador = await registrar.ejecutar(unJugadorValido());

    expect(jugador).toEqual({
      id: 1,
      nombres: 'Valeria',
      sesion: {
        token: 'token-1',
        expiraEn: new Date('2026-11-22T18:00:00.000Z'),
      },
    });
  });

  it('guarda el hash de la contraseña, nunca el texto', async () => {
    const { usuarios, registrar } = prepararRegistro();

    await registrar.ejecutar(unJugadorValido({ contrasena: 'pichanga10' }));

    expect(usuarios.todos()[0].contrasenaHash).toBe('hash(pichanga10)');
  });

  it('registra al jugador aunque su documento ya tenga una cuenta de personal', async () => {
    const { usuarios, registrar } = prepararRegistro();
    await usuarios.crearPersonal(
      Usuario.registrarRecepcionista(
        {
          ...datosDeDominio(),
          correo: Correo.crear('valeria.leon@laprevia.pe'),
        },
        new Date('2026-11-29T15:00:00.000Z'),
      ),
    );

    await registrar.ejecutar(unJugadorValido());

    expect(usuarios.todos().map((usuario) => usuario.rol)).toEqual([
      'RECEPCIONISTA',
      'JUGADOR',
    ]);
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

    expect(usuarios.todos()[0].fechaNacimiento?.fecha).toBe('1998-05-14');
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

  it('pide un correo personal si el jugador usa el dominio del local', async () => {
    const { usuarios, registrar } = prepararRegistro();

    const error = await capturarError(
      registrar.ejecutar(unJugadorValido({ correo: 'valeria@laprevia.pe' })),
    );

    expect((error as ReglaInvalidaError).errores).toEqual({
      correo:
        'Usa un correo personal: @laprevia.pe es solo para el personal del local.',
    });
    expect(usuarios.todos()).toHaveLength(0);
  });

  it('rechaza a un menor de 18 años y no guarda nada', async () => {
    const { usuarios, registrar } = prepararRegistro();

    const error = await capturarError(
      registrar.ejecutar(unJugadorValido({ fechaNacimiento: '2010-01-01' })),
    );

    expect((error as ReglaInvalidaError).errores).toEqual({
      fechaNacimiento: 'Debe tener al menos 18 años.',
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
