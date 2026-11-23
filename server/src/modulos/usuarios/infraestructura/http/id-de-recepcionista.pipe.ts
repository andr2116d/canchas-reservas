import { ParseIntPipe } from '@nestjs/common';
import { NoEncontradoError } from '../../../../compartido/dominio/dominio.error';

/** Lee el id de la ruta; uno que no es número responde igual que uno que no existe. */
export const ID_DE_RECEPCIONISTA = new ParseIntPipe({
  exceptionFactory: () =>
    new NoEncontradoError('No encontramos a esa recepcionista.'),
});
