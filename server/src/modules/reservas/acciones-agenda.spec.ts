import type { EstadoReserva } from '../../generated/prisma/enums';
import { accionesAgenda } from './acciones-agenda';

describe('acciones de la agenda', () => {
  it.each<[EstadoReserva, string[]]>([
    ['PENDIENTE_PAGO', ['CONFIRMAR_PAGO', 'CANCELAR', 'REUBICAR']],
    ['PENDIENTE_VALIDACION', ['CONFIRMAR_PAGO']],
    ['CONFIRMADA', ['CHECK_IN', 'MARCAR_AUSENTE', 'CANCELAR', 'REUBICAR']],
    ['EN_JUEGO', ['REGISTRAR_ADICIONALES', 'FINALIZAR']],
    ['FINALIZADA', []],
    ['CANCELADA', []],
    ['EXPIRADA', []],
    ['AUSENTE', []],
  ])('%s devuelve %j', (estado, acciones) => {
    expect(accionesAgenda(estado)).toEqual(acciones);
  });

  it('devuelve una copia que no altera las acciones del estado', () => {
    accionesAgenda('CONFIRMADA').pop();
    expect(accionesAgenda('CONFIRMADA')).toHaveLength(4);
  });
});
