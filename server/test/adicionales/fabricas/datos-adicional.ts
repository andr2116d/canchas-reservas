import type { DatosDeAdicional } from '../../../src/modulos/adicionales/dominio/adicional.entity';

/** Un adicional válido; se cambian solo los datos que importan en cada prueba. */
export function unAdicionalValido(
  cambios: Partial<DatosDeAdicional> = {},
): DatosDeAdicional {
  return {
    nombre: 'Balón',
    descripcion: 'N.º 5, cuero sintético.',
    precio: '45.00',
    ...cambios,
  };
}
