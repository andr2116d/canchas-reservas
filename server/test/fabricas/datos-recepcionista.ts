import type { DatosDeRecepcionista } from '../../src/modulos/usuarios/aplicacion/registrar-recepcionista.use-case';

export function unaRecepcionistaValida(
  cambios: Partial<DatosDeRecepcionista> = {},
): DatosDeRecepcionista {
  return {
    nombres: 'Rosa',
    apellidos: 'Quispe Lozano',
    fechaNacimiento: '1995-02-01',
    tipoDocumento: 'DNI',
    numeroDocumento: '41234567',
    celular: '912345678',
    usuarioDeCorreo: 'rosa.quispe',
    contrasena: 'temporal2026',
    ...cambios,
  };
}
