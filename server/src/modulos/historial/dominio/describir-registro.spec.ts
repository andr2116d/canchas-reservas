import { describirRegistro } from './describir-registro';

describe('describirRegistro', () => {
  it('una tarifa nueva muestra todos sus valores; el tipo es el sujeto', () => {
    const descrito = describirRegistro({
      categoria: 'TARIFAS',
      accion: 'ALTA',
      sujeto: 'FUTBOL_7',
      detalle: {
        antes: null,
        despues: {
          precioDia: '50.00',
          precioNoche: '80.00',
          duracion: 2,
          turnoCorto: false,
        },
      },
    });

    expect(descrito).toEqual({
      sujeto: 'Fútbol 7',
      detalle: [
        { campo: 'Precio de día', antes: null, despues: 'S/ 50.00' },
        { campo: 'Precio de noche', antes: null, despues: 'S/ 80.00' },
        { campo: 'Duración del turno', antes: null, despues: '2 h' },
        { campo: 'Turno corto', antes: null, despues: 'No se ofrece' },
      ],
    });
  });

  it('una tarifa editada muestra solo lo que cambió', () => {
    const { detalle } = describirRegistro({
      categoria: 'TARIFAS',
      accion: 'EDICION',
      sujeto: 'FUTBOL_5',
      detalle: {
        antes: {
          precioDia: '50.00',
          precioNoche: '80.00',
          duracion: 1,
          turnoCorto: false,
        },
        despues: {
          precioDia: '55.00',
          precioNoche: '80.00',
          duracion: 1,
          turnoCorto: true,
        },
      },
    });

    expect(detalle).toEqual([
      { campo: 'Precio de día', antes: 'S/ 50.00', despues: 'S/ 55.00' },
      { campo: 'Turno corto', antes: 'No se ofrece', despues: 'Se ofrece' },
    ]);
  });

  it('el horario muestra los días y la noche que cambiaron', () => {
    const descrito = describirRegistro({
      categoria: 'HORARIO',
      accion: 'EDICION',
      sujeto: null,
      detalle: {
        antes: {
          noche: 1080,
          dias: [
            { dia: 'LUNES', apertura: 480, cierre: 1380, noche: null },
            { dia: 'MARTES', apertura: 480, cierre: 1380, noche: null },
          ],
        },
        despues: {
          noche: 1140,
          dias: [
            { dia: 'LUNES', apertura: 540, cierre: 1440, noche: null },
            { dia: 'DOMINGO', apertura: 480, cierre: 1200, noche: 1020 },
          ],
        },
      },
    });

    expect(descrito).toEqual({
      sujeto: 'Horario de atención',
      detalle: [
        { campo: 'Inicio de la noche', antes: '18:00', despues: '19:00' },
        { campo: 'Lunes', antes: '08:00 – 23:00', despues: '09:00 – 24:00' },
        { campo: 'Martes', antes: '08:00 – 23:00', despues: 'Cerrado' },
        {
          campo: 'Domingo',
          antes: 'Cerrado',
          despues: '08:00 – 20:00, noche desde 17:00',
        },
      ],
    });
  });

  it('la regla de cancelación muestra sus rangos antes y después', () => {
    const descrito = describirRegistro({
      categoria: 'CANCELACION',
      accion: 'EDICION',
      sujeto: null,
      detalle: {
        antes: [
          { desdeHoras: 0, porcentaje: 0, ofreceCredito: false },
          { desdeHoras: 24, porcentaje: 100, ofreceCredito: true },
        ],
        despues: [
          { desdeHoras: 0, porcentaje: 0, ofreceCredito: false },
          { desdeHoras: 48, porcentaje: 100, ofreceCredito: false },
        ],
      },
    });

    expect(descrito).toEqual({
      sujeto: 'Regla de cancelación',
      detalle: [
        {
          campo: 'Rangos',
          antes: 'Desde 24 h: 100 % o crédito · desde 0 h: 0 %',
          despues: 'Desde 48 h: 100 % · desde 0 h: 0 %',
        },
      ],
    });
  });

  it('una cancha editada traduce el tamaño, la luz y los detalles', () => {
    const { detalle } = describirRegistro({
      categoria: 'CANCHAS',
      accion: 'EDICION',
      sujeto: 'Cancha 1',
      detalle: {
        nombre: { antes: 'Cancha 1', despues: 'La Grande' },
        tipo: { antes: 'FUTBOL_5', despues: 'FUTBOL_7' },
        tieneIluminacion: { antes: true, despues: false },
        caracteristicas: { antes: [], despues: ['TECHADA', 'BANCAS'] },
        nota: { antes: null, despues: 'Junto al estacionamiento.' },
      },
    });

    expect(detalle).toEqual([
      { campo: 'Nombre', antes: 'Cancha 1', despues: 'La Grande' },
      { campo: 'Tamaño', antes: 'Fútbol 5', despues: 'Fútbol 7' },
      { campo: 'Iluminación', antes: 'Con luz', despues: 'Sin luz' },
      { campo: 'Detalles', antes: 'Ninguno', despues: 'Techada, Bancas' },
      { campo: 'Nota', antes: null, despues: 'Junto al estacionamiento.' },
    ]);
  });

  it('un bloqueo muestra su tipo y su rango en hora de Lima', () => {
    const { detalle } = describirRegistro({
      categoria: 'MANTENIMIENTO',
      accion: 'BLOQUEO',
      sujeto: 'Cancha 2',
      detalle: {
        tipo: 'EMERGENCIA',
        inicio: '2026-11-24T15:30:00.000Z',
        fin: '2026-11-24T19:00:00.000Z',
      },
    });

    expect(detalle).toEqual([
      { campo: 'Tipo', antes: null, despues: 'Emergencia' },
      {
        campo: 'Rango',
        antes: null,
        despues: 'mar 24 nov 2026, 10:30 – 14:00',
      },
    ]);
  });

  it('un adicional nuevo muestra su precio; uno editado, el antes y el después', () => {
    const alta = describirRegistro({
      categoria: 'ADICIONALES',
      accion: 'ALTA',
      sujeto: 'Balón',
      detalle: { nombre: 'Balón', descripcion: null, precio: '45.00' },
    });
    const edicion = describirRegistro({
      categoria: 'ADICIONALES',
      accion: 'EDICION',
      sujeto: 'Pelota',
      detalle: {
        nombre: { antes: 'Balón', despues: 'Pelota' },
        precio: { antes: '45.00', despues: '50.00' },
      },
    });

    expect(alta.detalle).toEqual([
      { campo: 'Precio por unidad', antes: null, despues: 'S/ 45.00' },
    ]);
    expect(edicion.detalle).toEqual([
      { campo: 'Nombre', antes: 'Balón', despues: 'Pelota' },
      { campo: 'Precio por unidad', antes: 'S/ 45.00', despues: 'S/ 50.00' },
    ]);
  });

  it('las cuentas y los accesos no llevan detalle', () => {
    expect(
      describirRegistro({
        categoria: 'CUENTAS',
        accion: 'EDICION',
        sujeto: 'Rosa Díaz',
        detalle: null,
      }),
    ).toEqual({ sujeto: 'Rosa Díaz', detalle: [] });
    expect(
      describirRegistro({
        categoria: 'ACCESOS',
        accion: 'INICIO_DE_SESION',
        sujeto: null,
        detalle: null,
      }),
    ).toEqual({ sujeto: null, detalle: [] });
  });
});
