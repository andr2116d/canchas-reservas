/**
 * Un objeto de valor rechazó el dato recibido. Su mensaje explica qué corregir
 * y se muestra a la persona junto al campo correspondiente.
 */
export class ValorInvalidoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ValorInvalidoError';
  }
}
