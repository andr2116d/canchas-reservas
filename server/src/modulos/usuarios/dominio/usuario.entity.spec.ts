import { Celular } from './celular.value-object';
import { Correo } from '../../../compartido/dominio/correo.value-object';
import { DocumentoIdentidad } from '../../../compartido/dominio/documento-identidad.value-object';
import { FechaNacimiento } from './fecha-nacimiento.value-object';
import { NombrePersona } from '../../../compartido/dominio/nombre-persona.value-object';
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

  describe('registrarRecepcionista', () => {
    it('crea la cuenta activa con rol recepcionista y sus datos personales', () => {
      const datos = {
        ...datosDeUnJugador(),
        correo: Correo.crear('valeria.leon@laprevia.pe'),
      };

      const usuario = Usuario.registrarRecepcionista(
        datos,
        new Date('2026-11-29T15:00:00.000Z'),
      );

      expect(usuario.rol).toBe('RECEPCIONISTA');
      expect(usuario.estaActivo()).toBe(true);
      expect(usuario.documento?.identificador()).toBe('DNI:45678912');
      expect(usuario.dorsal).toBeUndefined();
    });

    it('exige cambiar la contraseña temporal en su primer acceso', () => {
      const usuario = Usuario.registrarRecepcionista(
        datosDeUnJugador(),
        new Date('2026-11-29T15:00:00.000Z'),
      );

      expect(usuario.requiereCambiarContrasena).toBe(true);
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
