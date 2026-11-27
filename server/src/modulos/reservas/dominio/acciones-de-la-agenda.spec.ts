import { accionesPermitidas } from './acciones-de-la-agenda';

describe('accionesPermitidas', () => {
  it('una confirmada admite check-in, ausente, cancelar y reubicar', () => {
    expect(accionesPermitidas('CONFIRMADA')).toEqual([
      'CHECK_IN',
      'MARCAR_AUSENTE',
      'CANCELAR',
      'REUBICAR',
    ]);
  });

  it('una pendiente de pago solo se cancela o se reubica', () => {
    expect(accionesPermitidas('PENDIENTE_DE_PAGO')).toEqual([
      'CANCELAR',
      'REUBICAR',
    ]);
  });

  it('una en juego solo se finaliza', () => {
    expect(accionesPermitidas('EN_JUEGO')).toEqual(['FINALIZAR']);
  });

  it('una expirada no admite ninguna acción', () => {
    expect(accionesPermitidas('EXPIRADA')).toEqual([]);
  });

  it('una pendiente de validación espera el resultado del pago antes de cualquier acción', () => {
    expect(accionesPermitidas('PENDIENTE_DE_VALIDACION')).toEqual([]);
  });
});
