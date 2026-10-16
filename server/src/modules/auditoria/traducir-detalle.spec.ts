import { detalleCambios } from './detalle-cambios';
import { traducirDetalle, type Nombres } from './traducir-detalle';

const nombres: Nombres = {
  cancha: (id) => (id === 3 ? 'Cancha 1' : `Cancha #${id}`),
  reserva: (id) => ({ 12: 'LP7K2M9Q', 13: 'QW3E4R5T' })[id] ?? `Reserva #${id}`,
};

const dia = (
  diaSemana: number,
  apertura: string | null = '08:00',
  cierre: string | null = '23:00',
) => ({ diaSemana, abierto: apertura !== null, apertura, cierre });

describe('traducirDetalle', () => {
  describe('CANCHA', () => {
    it('crear lista cada campo como nuevo', () => {
      expect(
        traducirDetalle('CANCHA', {
          nuevo: {
            nombre: 'Cancha 1',
            tamano: 'FUTBOL_5',
            iluminacion: true,
            estado: 'OPERATIVA',
            activa: true,
          },
        }),
      ).toEqual([
        { campo: 'nombre', anterior: null, nuevo: 'Cancha 1' },
        { campo: 'tamano', anterior: null, nuevo: 'FUTBOL_5' },
        { campo: 'iluminacion', anterior: null, nuevo: true },
        { campo: 'estado', anterior: null, nuevo: 'OPERATIVA' },
        { campo: 'activa', anterior: null, nuevo: true },
      ]);
    });

    it('editar muestra solo lo que cambió', () => {
      const detalle = detalleCambios(
        { nombre: 'Cancha 1', estado: 'OPERATIVA', iluminacion: true },
        { nombre: 'Cancha 1', estado: 'EN_MANTENIMIENTO', iluminacion: true },
      );

      expect(traducirDetalle('CANCHA', detalle)).toEqual([
        { campo: 'estado', anterior: 'OPERATIVA', nuevo: 'EN_MANTENIMIENTO' },
      ]);
    });

    it('desactivar muestra activa', () => {
      expect(
        traducirDetalle(
          'CANCHA',
          detalleCambios({ activa: true }, { activa: false }),
        ),
      ).toEqual([{ campo: 'activa', anterior: true, nuevo: false }]);
    });

    it('eliminar deja los campos anteriores sin id y las tarifas borradas', () => {
      expect(
        traducirDetalle('CANCHA', {
          anterior: {
            id: 3,
            nombre: 'Cancha 1',
            tamano: 'FUTBOL_7',
            iluminacion: false,
            estado: 'OPERATIVA',
            activa: true,
          },
          tarifasBorradas: 2,
          bloqueosBorrados: 0,
        }),
      ).toEqual([
        { campo: 'nombre', anterior: 'Cancha 1', nuevo: null },
        { campo: 'tamano', anterior: 'FUTBOL_7', nuevo: null },
        { campo: 'iluminacion', anterior: false, nuevo: null },
        { campo: 'estado', anterior: 'OPERATIVA', nuevo: null },
        { campo: 'activa', anterior: true, nuevo: null },
        { campo: 'tarifasBorradas', anterior: null, nuevo: 2 },
      ]);
    });
  });

  describe('TARIFA', () => {
    it('editar muestra el valor anterior y el nuevo, sin cancha ni franja', () => {
      expect(
        traducirDetalle('TARIFA', {
          canchaId: 3,
          franja: 'NOCHE',
          ...detalleCambios({ valor: 80 }, { valor: 90.5 }),
        }),
      ).toEqual([{ campo: 'valor', anterior: 80, nuevo: 90.5 }]);
    });

    it('crear parte de null', () => {
      expect(
        traducirDetalle('TARIFA', {
          canchaId: 3,
          franja: 'DIA',
          ...detalleCambios({ valor: null }, { valor: 60 }),
        }),
      ).toEqual([{ campo: 'valor', anterior: null, nuevo: 60 }]);
    });

    it('normaliza montos guardados como texto a número con 2 decimales', () => {
      expect(
        traducirDetalle('TARIFA', {
          anterior: { valor: '55.5' },
          nuevo: { valor: '60.004' },
        }),
      ).toEqual([{ campo: 'valor', anterior: 55.5, nuevo: 60 }]);
    });
  });

  describe('HORARIO', () => {
    it('muestra cada día cambiado y el inicio de noche', () => {
      const detalle = detalleCambios(
        { dias: [dia(1), dia(7)], inicioNoche: '18:00' },
        {
          dias: [dia(1, null, null), dia(7, '09:15', '22:00')],
          inicioNoche: '19:00',
        },
      );

      expect(traducirDetalle('HORARIO', detalle)).toEqual([
        { campo: 'dia.1', anterior: '08:00-23:00', nuevo: 'CERRADO' },
        { campo: 'dia.7', anterior: '08:00-23:00', nuevo: '09:15-22:00' },
        { campo: 'inicioNoche', anterior: '18:00', nuevo: '19:00' },
      ]);
    });

    it('si solo cambió la noche no lista días', () => {
      const detalle = detalleCambios(
        { dias: [], inicioNoche: '18:00' },
        { dias: [], inicioNoche: '17:30' },
      );

      expect(traducirDetalle('HORARIO', detalle)).toEqual([
        { campo: 'inicioNoche', anterior: '18:00', nuevo: '17:30' },
      ]);
    });

    it('un día cerrado que abre pasa de CERRADO al tramo', () => {
      expect(
        traducirDetalle('HORARIO', {
          anterior: {
            dias: [
              { diaSemana: 3, abierto: false, apertura: null, cierre: null },
            ],
          },
          nuevo: { dias: [dia(3, '10:00', '20:00')] },
        }),
      ).toEqual([
        { campo: 'dia.3', anterior: 'CERRADO', nuevo: '10:00-20:00' },
      ]);
    });

    it('lista los códigos de las reservas que quedaron fuera de horario', () => {
      expect(
        traducirDetalle(
          'HORARIO',
          {
            anterior: { dias: [dia(2)] },
            nuevo: { dias: [dia(2, '10:00', '23:00')] },
            reservasFueraDeHorario: [12, 13, 99],
          },
          nombres,
        ),
      ).toEqual([
        { campo: 'dia.2', anterior: '08:00-23:00', nuevo: '10:00-23:00' },
        {
          campo: 'reservasFueraDeHorario',
          anterior: null,
          nuevo: 'LP7K2M9Q, QW3E4R5T, Reserva #99',
        },
      ]);
    });

    it('si los días no tienen la forma esperada usa el caso genérico', () => {
      expect(
        traducirDetalle('HORARIO', {
          anterior: { dias: 'lunes' },
          nuevo: { dias: 'martes' },
        }),
      ).toEqual([{ campo: 'dias', anterior: 'lunes', nuevo: 'martes' }]);
    });
  });

  describe('REGLA_CANCELACION', () => {
    it('muestra los valores anteriores y nuevos que cambiaron', () => {
      expect(
        traducirDetalle('REGLA_CANCELACION', {
          anterior: { horasAnticipacion: 24, tipoCompensacion: 'CREDITO' },
          nuevo: { horasAnticipacion: 12, tipoCompensacion: 'DEVOLUCION' },
        }),
      ).toEqual([
        { campo: 'horasAnticipacion', anterior: 24, nuevo: 12 },
        { campo: 'tipoCompensacion', anterior: 'CREDITO', nuevo: 'DEVOLUCION' },
      ]);
    });

    it('omite el campo que quedó igual', () => {
      expect(
        traducirDetalle('REGLA_CANCELACION', {
          anterior: { horasAnticipacion: 24, tipoCompensacion: 'CREDITO' },
          nuevo: { horasAnticipacion: 24, tipoCompensacion: 'DEVOLUCION' },
        }),
      ).toEqual([
        { campo: 'tipoCompensacion', anterior: 'CREDITO', nuevo: 'DEVOLUCION' },
      ]);
    });

    it('guardada sin cambios no devuelve cambios', () => {
      const regla = { horasAnticipacion: 24, tipoCompensacion: 'CREDITO' };

      expect(
        traducirDetalle('REGLA_CANCELACION', { anterior: regla, nuevo: regla }),
      ).toEqual([]);
    });
  });

  describe('RESERVA', () => {
    const creada = {
      codigo: 'LP7K2M9Q',
      canchaId: 3,
      fecha: '2026-10-20',
      horaInicio: '18:00',
      valorTurno: 80,
      adelantoMinimo: 40,
      creditoAplicado: 0,
    };

    it('crear muestra cancha por nombre, fecha, hora y montos, sin código', () => {
      expect(traducirDetalle('RESERVA', creada, nombres)).toEqual([
        { campo: 'cancha', anterior: null, nuevo: 'Cancha 1' },
        { campo: 'fecha', anterior: null, nuevo: '2026-10-20' },
        { campo: 'horaInicio', anterior: null, nuevo: '18:00' },
        { campo: 'valorTurno', anterior: null, nuevo: 80 },
        { campo: 'adelantoMinimo', anterior: null, nuevo: 40 },
      ]);
    });

    it('incluye el crédito aplicado cuando hubo', () => {
      expect(
        traducirDetalle(
          'RESERVA',
          { ...creada, creditoAplicado: 27.53 },
          nombres,
        ),
      ).toContainEqual({
        campo: 'creditoAplicado',
        anterior: null,
        nuevo: 27.53,
      });
    });

    it('sin nombres conocidos usa el id de la cancha', () => {
      expect(traducirDetalle('RESERVA', creada)[0]).toEqual({
        campo: 'cancha',
        anterior: null,
        nuevo: 'Cancha #3',
      });
    });

    it('una acción con anterior y nuevo se traduce campo a campo', () => {
      expect(
        traducirDetalle('RESERVA', {
          anterior: { estado: 'PENDIENTE_PAGO' },
          nuevo: { estado: 'EXPIRADA' },
        }),
      ).toEqual([
        { campo: 'estado', anterior: 'PENDIENTE_PAGO', nuevo: 'EXPIRADA' },
      ]);
    });
  });

  describe('RECEPCIONISTA', () => {
    it('crear lista los datos sin contraseña', () => {
      expect(
        traducirDetalle('RECEPCIONISTA', {
          nuevo: {
            nombres: 'Ana',
            apellidos: 'Pérez',
            tipoDocumento: 'DNI',
            numeroDocumento: '12345678',
            correo: 'ana@laprevia.pe',
            telefono: '911111111',
          },
        }).map(({ campo }) => campo),
      ).toEqual([
        'nombres',
        'apellidos',
        'tipoDocumento',
        'numeroDocumento',
        'correo',
        'telefono',
      ]);
    });

    it('editar y desactivar muestran el campo cambiado', () => {
      expect(
        traducirDetalle(
          'RECEPCIONISTA',
          detalleCambios({ telefono: '911111111' }, { telefono: '922222222' }),
        ),
      ).toEqual([
        { campo: 'telefono', anterior: '911111111', nuevo: '922222222' },
      ]);
      expect(
        traducirDetalle(
          'RECEPCIONISTA',
          detalleCambios({ estado: 'ACTIVO' }, { estado: 'INACTIVO' }),
        ),
      ).toEqual([{ campo: 'estado', anterior: 'ACTIVO', nuevo: 'INACTIVO' }]);
    });

    it('restablecer contraseña no tiene detalle', () => {
      expect(traducirDetalle('RECEPCIONISTA', null)).toEqual([]);
    });
  });

  describe('ADICIONAL', () => {
    it('crear, editar precio, desactivar y eliminar', () => {
      expect(
        traducirDetalle('ADICIONAL', {
          nuevo: { nombre: 'Agua', precio: 2.5, activo: true },
        }),
      ).toEqual([
        { campo: 'nombre', anterior: null, nuevo: 'Agua' },
        { campo: 'precio', anterior: null, nuevo: 2.5 },
        { campo: 'activo', anterior: null, nuevo: true },
      ]);
      expect(
        traducirDetalle(
          'ADICIONAL',
          detalleCambios({ precio: 2.5 }, { precio: 3 }),
        ),
      ).toEqual([{ campo: 'precio', anterior: 2.5, nuevo: 3 }]);
      expect(
        traducirDetalle(
          'ADICIONAL',
          detalleCambios({ activo: true }, { activo: false }),
        ),
      ).toEqual([{ campo: 'activo', anterior: true, nuevo: false }]);
      expect(
        traducirDetalle('ADICIONAL', {
          anterior: { id: 4, nombre: 'Agua', precio: 3, activo: false },
        }),
      ).toEqual([
        { campo: 'nombre', anterior: 'Agua', nuevo: null },
        { campo: 'precio', anterior: 3, nuevo: null },
        { campo: 'activo', anterior: false, nuevo: null },
      ]);
    });
  });

  describe('caso genérico', () => {
    it('entidad desconocida con anterior y nuevo va campo a campo', () => {
      expect(
        traducirDetalle('PAGO', {
          anterior: { estado: 'PENDIENTE' },
          nuevo: { estado: 'APROBADO', numeroOperacion: '123' },
          canal: 'ONLINE',
        }),
      ).toEqual([
        { campo: 'estado', anterior: 'PENDIENTE', nuevo: 'APROBADO' },
        { campo: 'numeroOperacion', anterior: null, nuevo: '123' },
        { campo: 'canal', anterior: null, nuevo: 'ONLINE' },
      ]);
    });

    it('un objeto plano lista cada clave como nuevo', () => {
      expect(traducirDetalle('OTRA', { motivo: 'Lluvia', horas: 2 })).toEqual([
        { campo: 'motivo', anterior: null, nuevo: 'Lluvia' },
        { campo: 'horas', anterior: null, nuevo: 2 },
      ]);
    });

    it('los valores anidados se convierten en texto JSON', () => {
      expect(
        traducirDetalle('OTRA', { nuevo: { contactos: [{ telefono: '9' }] } }),
      ).toEqual([
        { campo: 'contactos', anterior: null, nuevo: '[{"telefono":"9"}]' },
      ]);
    });

    it('un detalle que no es objeto queda como un solo cambio', () => {
      expect(traducirDetalle('OTRA', 'texto suelto')).toEqual([
        { campo: 'detalle', anterior: null, nuevo: 'texto suelto' },
      ]);
      expect(traducirDetalle('CANCHA', [1, 2])).toEqual([
        { campo: 'detalle', anterior: null, nuevo: '[1,2]' },
      ]);
    });

    it('sin detalle no hay cambios', () => {
      expect(traducirDetalle('RESERVA', null)).toEqual([]);
      expect(traducirDetalle('RESERVA', undefined)).toEqual([]);
    });
  });
  describe('orden de los campos', () => {
    it('ordena como el formulario aunque jsonb devuelva las claves por longitud', () => {
      expect(
        traducirDetalle('CANCHA', {
          nuevo: {
            activa: true,
            estado: 'OPERATIVA',
            nombre: 'Cancha 1',
            tamano: 'FUTBOL_5',
            iluminacion: true,
          },
        }).map(({ campo }) => campo),
      ).toEqual(['nombre', 'tamano', 'iluminacion', 'estado', 'activa']);
      expect(
        traducirDetalle('REGLA_CANCELACION', {
          anterior: { tipoCompensacion: 'CREDITO', horasAnticipacion: 24 },
          nuevo: { tipoCompensacion: 'DEVOLUCION', horasAnticipacion: 12 },
        }).map(({ campo }) => campo),
      ).toEqual(['horasAnticipacion', 'tipoCompensacion']);
      expect(
        traducirDetalle('ADICIONAL', {
          nuevo: { activo: true, nombre: 'Agua', precio: 2 },
        }).map(({ campo }) => campo),
      ).toEqual(['nombre', 'precio', 'activo']);
    });

    it('los campos desconocidos van al final en el orden en que llegan', () => {
      expect(
        traducirDetalle('RECEPCIONISTA', {
          nuevo: {
            zona: 'Norte',
            correo: 'a@b.pe',
            alias: 'Ana',
            nombres: 'Ana',
          },
        }).map(({ campo }) => campo),
      ).toEqual(['nombres', 'correo', 'zona', 'alias']);
    });
  });
});
