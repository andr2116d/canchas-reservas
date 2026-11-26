import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import {
  unaHojaValida,
  unRepresentante,
} from '../../../../test/reclamos/fabricas/datos-de-hoja';
import { HojaDeReclamacion } from './hoja-de-reclamacion.entity';

const REGISTRADA_EN = new Date('2026-11-25T15:00:00.000Z');

function erroresAlRegistrar(cambios: Parameters<typeof unaHojaValida>[0]) {
  try {
    HojaDeReclamacion.registrar(unaHojaValida(cambios), REGISTRADA_EN);
  } catch (error) {
    if (error instanceof ReglaInvalidaError) return error.errores;
    throw error;
  }
  throw new Error('Se esperaba que la hoja no se registrara.');
}

describe('HojaDeReclamacion.registrar', () => {
  it('queda nueva, con el tipo que marcó la persona y su fecha límite', () => {
    const hoja = HojaDeReclamacion.registrar(unaHojaValida(), REGISTRADA_EN);

    expect(hoja.estado).toBe('NUEVA');
    expect(hoja.tipo).toBe('RECLAMO');
    expect(hoja.tipoMarcado).toBe('RECLAMO');
    expect(hoja.motivo).toBeNull();
    expect(hoja.registradaEn).toEqual(REGISTRADA_EN);
    expect(hoja.fechaLimite).toBe('2026-12-16');
  });

  it('normaliza los datos de la persona y el monto en soles', () => {
    const hoja = HojaDeReclamacion.registrar(
      unaHojaValida({ telefono: '044-123456', nombres: '  Valeria  ' }),
      REGISTRADA_EN,
    );

    expect(hoja.consumidor).toEqual({
      documento: { tipo: 'DNI', numero: '45871236' },
      nombres: 'Valeria',
      apellidos: 'León Paredes',
      domicilio: 'Av. América Sur 1250, Trujillo',
      telefono: '044123456',
      correo: 'valeria.leon@gmail.com',
    });
    expect(hoja.servicio.montoReclamado?.enSoles()).toBe('40.00');
  });

  it('el monto y la descripción del servicio son opcionales', () => {
    const hoja = HojaDeReclamacion.registrar(
      unaHojaValida({ montoReclamado: '', descripcionDelServicio: ' ' }),
      REGISTRADA_EN,
    );

    expect(hoja.servicio).toEqual({
      servicio: 'RESERVA_DE_CANCHA',
      montoReclamado: null,
      descripcion: null,
    });
  });

  it('reúne en una sola respuesta lo que falta en cada campo obligatorio', () => {
    expect(
      erroresAlRegistrar({
        numeroDocumento: '',
        nombres: '',
        apellidos: '',
        domicilio: '',
        telefono: '',
        correo: '',
        servicio: '',
        tipo: '',
        detalle: '',
        pedido: '',
        medioDeRespuesta: '',
      }),
    ).toEqual({
      numeroDocumento: 'Ingresa el número de documento.',
      nombres: 'Ingresa los nombres.',
      apellidos: 'Ingresa los apellidos.',
      domicilio: 'Ingresa el domicilio.',
      telefono: 'Ingresa el teléfono.',
      correo: 'Ingresa el correo.',
      servicio: 'Elige el servicio contratado.',
      tipo: 'Elige si es un reclamo o una queja.',
      detalle: 'Ingresa el detalle.',
      pedido: 'Ingresa el pedido.',
      medioDeRespuesta: 'Elige cómo recibir la respuesta.',
    });
  });

  it('rechaza un teléfono que no es celular ni fijo con código de ciudad', () => {
    expect(erroresAlRegistrar({ telefono: '12345' })).toEqual({
      telefono:
        'Ingresa un teléfono de 7 a 9 dígitos: celular o fijo con su código de ciudad.',
    });
  });

  it('rechaza textos más largos de lo permitido', () => {
    expect(
      erroresAlRegistrar({
        domicilio: 'a'.repeat(201),
        descripcionDelServicio: 'a'.repeat(201),
        detalle: 'a'.repeat(2001),
        pedido: 'a'.repeat(1001),
      }),
    ).toEqual({
      domicilio: 'El domicilio no puede tener más de 200 caracteres.',
      descripcionDelServicio:
        'La descripción no puede tener más de 200 caracteres.',
      detalle: 'El detalle no puede tener más de 2000 caracteres.',
      pedido: 'El pedido no puede tener más de 1000 caracteres.',
    });
  });

  it('rechaza un monto mal escrito', () => {
    expect(erroresAlRegistrar({ montoReclamado: '40,555' })).toEqual({
      montoReclamado: 'Usa como máximo dos decimales.',
    });
  });

  it('si quien reclama es menor de edad, exige los datos de quien lo representa', () => {
    expect(erroresAlRegistrar({ esMenorDeEdad: true })).toEqual({
      representanteNombre:
        'Ingresa el nombre de quien representa a la persona menor de edad.',
      representanteDomicilio: 'Ingresa el domicilio.',
      representanteTelefono: 'Ingresa el teléfono.',
      representanteCorreo: 'Ingresa el correo.',
    });
  });

  it('guarda los datos de quien representa a la persona menor de edad', () => {
    const hoja = HojaDeReclamacion.registrar(
      unaHojaValida({ esMenorDeEdad: true, ...unRepresentante() }),
      REGISTRADA_EN,
    );

    expect(hoja.representante).toEqual({
      nombre: 'Rosa Paredes Díaz',
      domicilio: 'Av. América Sur 1250, Trujillo',
      telefono: '912345678',
      correo: 'rosa.paredes@gmail.com',
    });
  });

  it('si no es menor de edad, no guarda datos de representante aunque lleguen', () => {
    const hoja = HojaDeReclamacion.registrar(
      unaHojaValida({ esMenorDeEdad: false, ...unRepresentante() }),
      REGISTRADA_EN,
    );

    expect(hoja.representante).toBeNull();
  });
});
