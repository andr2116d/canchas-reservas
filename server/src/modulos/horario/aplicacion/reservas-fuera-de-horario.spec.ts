import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { EnMemoriaHorarioRepository } from '../../../../test/horario/dobles/en-memoria-horario.repository';
import {
  ReservasPorJugarDePrueba,
  unaReservaPorJugar,
} from '../../../../test/horario/dobles/reservas-por-jugar-de-prueba';
import { DIAS_DE_LA_SEMANA } from '../dominio/dia-de-la-semana';
import { ReservasFueraDeHorarioError } from '../dominio/reservas-fuera-de-horario.error';
import type { DatosDelHorario } from './construir-horario';
import { DefinirHorarioUseCase } from './definir-horario.use-case';

const ADMINISTRADOR = 9;

/** Todos los días de 08:00 a 22:00, salvo lo que se cambie. El 28 de noviembre de 2026 es sábado. */
function unaSemana(sabado: object = {}): DatosDelHorario {
  return {
    inicioDeLaNoche: '18:00',
    dias: DIAS_DE_LA_SEMANA.map((dia) => ({
      dia,
      abierto: true,
      abre: '08:00',
      cierra: '22:00',
      ...(dia === 'SABADO' ? sabado : {}),
    })),
  };
}

async function preparar() {
  const horarios = new EnMemoriaHorarioRepository();
  const reservas = new ReservasPorJugarDePrueba();
  const definir = new DefinirHorarioUseCase(
    horarios,
    reservas,
    new RelojDePrueba(),
  );
  await definir.ejecutar(unaSemana(), ADMINISTRADOR);
  return { horarios, reservas, definir };
}

describe('Cambiar el horario con reservas por jugar', () => {
  it('si una reserva queda fuera, no guarda y devuelve la lista para avisar a cada cliente', async () => {
    const { definir, reservas, horarios } = await preparar();
    reservas.reservas.push(unaReservaPorJugar());

    const rechazo = definir.ejecutar(
      unaSemana({ cierra: '19:30' }),
      ADMINISTRADOR,
    );

    await expect(rechazo).rejects.toThrow(ReservasFueraDeHorarioError);
    await expect(rechazo).rejects.toMatchObject({
      datos: {
        reservasFueraDeHorario: [
          {
            codigo: '7K3Q9X',
            cancha: 'Cancha 1',
            fecha: '2026-11-28',
            desde: '19:00',
            hasta: '20:00',
            estado: 'CONFIRMADA',
            titular: 'Lucía Ramos Vega',
            celular: '987654321',
          },
        ],
      },
    });
    expect(horarios.versiones).toHaveLength(1);
  });

  it('un día que pasa a cerrado deja fuera sus reservas', async () => {
    const { definir, reservas } = await preparar();
    reservas.reservas.push(unaReservaPorJugar());

    await expect(
      definir.ejecutar(unaSemana({ abierto: false }), ADMINISTRADOR),
    ).rejects.toThrow(ReservasFueraDeHorarioError);
  });

  it('con la confirmación guarda igual, respeta las reservas y anota cuáles quedaron fuera', async () => {
    const { definir, reservas, horarios } = await preparar();
    reservas.reservas.push(unaReservaPorJugar());

    const { cambio } = await definir.ejecutar(
      { ...unaSemana({ cierra: '19:30' }), confirmar: true },
      ADMINISTRADOR,
    );

    expect(cambio).toBe(true);
    expect(horarios.fueraDeHorario.at(-1)).toEqual(['7K3Q9X']);
  });

  it('una reserva que sigue dentro del horario no frena el cambio, aunque sus turnos cambien', async () => {
    const { definir, reservas, horarios } = await preparar();
    reservas.reservas.push(unaReservaPorJugar());

    await definir.ejecutar(unaSemana({ abre: '16:30' }), ADMINISTRADOR);

    expect(horarios.versiones).toHaveLength(2);
    expect(horarios.fueraDeHorario.at(-1)).toEqual([]);
  });

  it('guardar el mismo horario no pide confirmar nada', async () => {
    const { definir, reservas, horarios } = await preparar();
    reservas.reservas.push(
      unaReservaPorJugar({ inicio: new Date('2026-11-28T07:00:00-05:00') }),
    );

    const { cambio } = await definir.ejecutar(unaSemana(), ADMINISTRADOR);

    expect(cambio).toBe(false);
    expect(horarios.versiones).toHaveLength(1);
  });

  it('un turno que termina a medianoche se compara hasta las 24:00', async () => {
    const { definir, reservas } = await preparar();
    reservas.reservas.push(
      unaReservaPorJugar({
        inicio: new Date('2026-11-28T23:00:00-05:00'),
        fin: new Date('2026-11-29T00:00:00-05:00'),
      }),
    );

    await expect(
      definir.ejecutar(unaSemana({ cierra: '24:00' }), ADMINISTRADOR),
    ).resolves.toMatchObject({ cambio: true });
  });
});
