import type { DatosRegistroJugador } from '../../src/modulos/usuarios/aplicacion/registrar-jugador.use-case';

/** Datos de un jugador que cumplen todas las reglas del registro. */
export function unJugadorValido(
  cambios: Partial<DatosRegistroJugador> = {},
): DatosRegistroJugador {
  return {
    nombres: 'Valeria',
    apellidos: 'León Paredes',
    fechaNacimiento: '1998-05-14',
    tipoDocumento: 'DNI',
    numeroDocumento: '45678912',
    correo: 'valeria.leon@gmail.com',
    celular: '987654321',
    contrasena: 'pichanga10',
    versionLegalAceptada: 'registro-1',
    ...cambios,
  };
}
