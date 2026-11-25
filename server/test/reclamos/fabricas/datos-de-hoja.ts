import type { DatosDeLaHoja } from '../../../src/modulos/reclamos/dominio/hoja-de-reclamacion.entity';

/** Una hoja completa y válida de una persona mayor de edad, con los cambios que pida la prueba. */
export function unaHojaValida(
  cambios: Partial<DatosDeLaHoja> = {},
): DatosDeLaHoja {
  return {
    tipoDocumento: 'DNI',
    numeroDocumento: '45871236',
    nombres: 'Valeria',
    apellidos: 'León Paredes',
    domicilio: 'Av. América Sur 1250, Trujillo',
    telefono: '987654321',
    correo: 'Valeria.Leon@gmail.com',
    esMenorDeEdad: false,
    servicio: 'RESERVA_DE_CANCHA',
    montoReclamado: '40',
    descripcionDelServicio: 'Turno del sábado 21, 20:30, Cancha 3',
    tipo: 'RECLAMO',
    detalle: 'La cancha estaba ocupada al llegar y no pudimos jugar.',
    pedido: 'Que devuelvan el adelanto completo.',
    medioDeRespuesta: 'CORREO',
    ...cambios,
  };
}

/** Datos de quien representa a una persona menor de edad. */
export function unRepresentante() {
  return {
    representanteNombre: 'Rosa Paredes Díaz',
    representanteDomicilio: 'Av. América Sur 1250, Trujillo',
    representanteTelefono: '912345678',
    representanteCorreo: 'rosa.paredes@gmail.com',
  };
}
