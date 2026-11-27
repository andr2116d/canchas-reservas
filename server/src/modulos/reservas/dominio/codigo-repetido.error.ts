/** Otra reserva ya usa el código elegido: se vuelve a intentar con otro. No llega a la persona. */
export class CodigoRepetidoError extends Error {
  constructor() {
    super('El código de la reserva ya existe.');
    this.name = 'CodigoRepetidoError';
  }
}
