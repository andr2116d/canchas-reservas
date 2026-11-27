import { describirRegistro } from './describir-registro';

describe('Detalle de una reserva en el historial', () => {
  it('la reserva es el sujeto y el detalle dice cancha, turno, montos y canal', () => {
    const descrito = describirRegistro({
      categoria: 'RESERVAS',
      accion: 'SEPARACION',
      sujeto: 'Reserva 7K3Q9X',
      detalle: {
        cancha: 'Cancha 2',
        inicio: '2026-11-28T19:00:00-05:00',
        fin: '2026-11-28T20:00:00-05:00',
        precio: '80.00',
        adelanto: '40.00',
        canal: 'web',
      },
    });

    expect(descrito).toEqual({
      sujeto: 'Reserva 7K3Q9X',
      detalle: [
        { campo: 'Cancha', antes: null, despues: 'Cancha 2' },
        {
          campo: 'Turno',
          antes: null,
          despues: 'sáb 28 nov 2026, 19:00 – 20:00',
        },
        { campo: 'Precio', antes: null, despues: 'S/ 80.00' },
        { campo: 'Adelanto', antes: null, despues: 'S/ 40.00' },
        { campo: 'Canal', antes: null, despues: 'Web' },
      ],
    });
  });
});
