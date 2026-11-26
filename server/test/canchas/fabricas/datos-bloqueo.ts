import type { DatosParaBloquear } from '../../../src/modulos/canchas/aplicacion/bloquear-canchas.use-case';

/** Un bloqueo programado de la cancha 1 el sábado 28 de noviembre de 2026, de 08:00 a 14:00 en Lima. */
export function unBloqueoValido(
  cambios: Partial<DatosParaBloquear> = {},
): DatosParaBloquear {
  return {
    canchaIds: [1],
    tipo: 'PROGRAMADO',
    desdeAhora: false,
    desdeFecha: '2026-11-28',
    desdeHora: '08:00',
    hastaFecha: '2026-11-28',
    hastaHora: '14:00',
    motivo: 'Peinado del césped.',
    ...cambios,
  };
}
