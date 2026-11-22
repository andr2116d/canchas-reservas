import { Celular } from './celular.value-object';
import { Correo } from './correo.value-object';
import { DocumentoIdentidad } from './documento-identidad.value-object';
import { FechaNacimiento } from './fecha-nacimiento.value-object';
import { NombrePersona } from './nombre-persona.value-object';
import { Usuario } from './usuario.entity';

function datosDeUnJugador() {
  return {
    nombres: NombrePersona.crear('Valeria', 'nombres'),
    apellidos: NombrePersona.crear('León', 'apellidos'),
    fechaNacimiento: FechaNacimiento.restaurar('1998-05-14'),
    documento: DocumentoIdentidad.crear('DNI', '45678912'),
    correo: Correo.crear('valeria@gmail.com'),
    celular: Celular.crear('987654321'),
    contrasenaHash: 'hash-de-prueba',
  };
}

describe('Usuario', () => {
  describe('registrarJugador', () => {
    it('crea la cuenta con rol jugador', () => {
      const usuario = Usuario.registrarJugador(datosDeUnJugador());

      expect(usuario.rol).toBe('JUGADOR');
    });

    it('crea la cuenta activa, para que pueda iniciar sesión', () => {
      const usuario = Usuario.registrarJugador(datosDeUnJugador());

      expect(usuario.estado).toBe('ACTIVO');
      expect(usuario.estaActivo()).toBe(true);
    });

    it('no tiene id hasta que se guarda', () => {
      const usuario = Usuario.registrarJugador(datosDeUnJugador());

      expect(usuario.id).toBeUndefined();
    });
  });

  it('conserva el id al restaurarse desde la persistencia', () => {
    const usuario = Usuario.restaurar({
      ...datosDeUnJugador(),
      id: 7,
      rol: 'JUGADOR',
      estado: 'ACTIVO',
    });

    expect(usuario.id).toBe(7);
  });
});
