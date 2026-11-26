import {
  DIAS_HABILES_PARA_RESPONDER,
  diasHabilesRestantes,
  fechaLimiteDeRespuesta,
} from './plazo-de-respuesta';

// Hora de Lima (UTC−5) escrita en UTC.
const enLima = (fecha: string, hora: string) =>
  new Date(`${fecha}T${hora}:00.000-05:00`);

describe('fechaLimiteDeRespuesta', () => {
  it('da 15 días hábiles', () => {
    expect(DIAS_HABILES_PARA_RESPONDER).toBe(15);
  });

  it('cuenta de lunes a viernes desde el día siguiente al registro', () => {
    // Miércoles 25/11: del jueves 26/11 al miércoles 16/12 hay 15 días de lunes a viernes.
    expect(fechaLimiteDeRespuesta(enLima('2026-11-25', '10:00'))).toBe(
      '2026-12-16',
    );
  });

  it('un registro de fin de semana empieza a contar el lunes', () => {
    expect(fechaLimiteDeRespuesta(enLima('2026-11-28', '18:00'))).toBe(
      '2026-12-18',
    );
    expect(fechaLimiteDeRespuesta(enLima('2026-11-29', '09:00'))).toBe(
      '2026-12-18',
    );
  });

  it('usa la fecha de Lima aunque en UTC ya sea el día siguiente', () => {
    expect(fechaLimiteDeRespuesta(enLima('2026-11-25', '23:30'))).toBe(
      '2026-12-16',
    );
  });

  it('los feriados cuentan como días hábiles', () => {
    // Del 8 y el 25 de diciembre no se saltan: el plazo nunca es más largo que el legal.
    expect(fechaLimiteDeRespuesta(enLima('2026-12-07', '12:00'))).toBe(
      '2026-12-28',
    );
  });
});

describe('diasHabilesRestantes', () => {
  it('cuenta los días hábiles que faltan hasta la fecha límite, incluida', () => {
    expect(diasHabilesRestantes('2026-11-25', '2026-12-16')).toBe(15);
    expect(diasHabilesRestantes('2026-12-11', '2026-12-16')).toBe(3);
  });

  it('el día del vencimiento todavía queda ese día: cero restantes', () => {
    expect(diasHabilesRestantes('2026-12-16', '2026-12-16')).toBe(0);
  });

  it('después del vencimiento da los días hábiles de atraso en negativo', () => {
    expect(diasHabilesRestantes('2026-12-18', '2026-12-16')).toBe(-2);
    expect(diasHabilesRestantes('2026-12-19', '2026-12-16')).toBe(-2);
  });
});
