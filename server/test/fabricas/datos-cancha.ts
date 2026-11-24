import type { DatosDeCancha } from '../../src/modulos/canchas/dominio/cancha.entity';

export function unaCanchaValida(
  cambios: Partial<DatosDeCancha> = {},
): DatosDeCancha {
  return {
    nombre: 'Cancha 1',
    tipo: 'FUTBOL_5',
    tieneIluminacion: true,
    caracteristicas: ['BANCAS'],
    nota: '',
    ...cambios,
  };
}
