import { Sesion } from './sesion.entity';

const INICIO = new Date('2026-11-22T10:00:00.000Z');

function minutosDespues(minutos: number): Date {
  return new Date(INICIO.getTime() + minutos * 60 * 1000);
}

function unaSesionAbierta(): Sesion {
  return Sesion.abrir(1, Sesion.preparar('hash-del-token', INICIO));
}

describe('Sesion', () => {
  it('vence como máximo 8 horas después de abrirse', () => {
    const sesion = unaSesionAbierta();

    expect(sesion.expiraEn).toEqual(minutosDespues(8 * 60));
  });

  it('está vigente mientras hay actividad dentro de los 30 minutos', () => {
    const sesion = unaSesionAbierta();

    expect(sesion.estaVigente(minutosDespues(29))).toBe(true);
  });

  it('vence tras 30 minutos sin actividad', () => {
    const sesion = unaSesionAbierta();

    expect(sesion.estaVigente(minutosDespues(30))).toBe(false);
  });

  it('la actividad renueva el plazo de inactividad', () => {
    const sesion = unaSesionAbierta().registrarActividad(minutosDespues(25));

    expect(sesion.estaVigente(minutosDespues(50))).toBe(true);
  });

  it('vence a las 8 horas aunque haya actividad', () => {
    let sesion = unaSesionAbierta();
    for (let minuto = 20; minuto < 8 * 60; minuto += 20) {
      sesion = sesion.registrarActividad(minutosDespues(minuto));
    }

    expect(sesion.estaVigente(minutosDespues(8 * 60))).toBe(false);
  });
});
