import type { Correo } from '../../../src/modulos/correo/dominio/correo';

/** Un correo del servicio válido, con los cambios que pida la prueba. */
export function unCorreo(cambios: Partial<Correo> = {}): Correo {
  return {
    para: 'valeria.leon@gmail.com',
    asunto: 'Hoja de reclamación N.º 000001-2026',
    texto: 'Registramos tu hoja.',
    html: '<p>Registramos tu hoja.</p>',
    ...cambios,
  };
}
