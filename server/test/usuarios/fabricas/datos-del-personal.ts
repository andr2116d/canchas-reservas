/** Datos completos de un administrador para su primer ingreso; se cambian solo los que importan. */
export function datosDelAdministrador(cambios: Record<string, string> = {}) {
  return {
    nombres: 'Valeria',
    apellidos: 'León Paredes',
    fechaNacimiento: '1990-03-02',
    tipoDocumento: 'DNI',
    numeroDocumento: '45678912',
    celular: '987654321',
    ...cambios,
  };
}
