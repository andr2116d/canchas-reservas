import { ParseIntPipe } from '@nestjs/common';
import { RecepcionistaNoEncontradaError } from '../../dominio/recepcionista-no-encontrada.error';

/** Lee el id de la ruta; uno que no es número responde igual que uno que no existe. */
export const ID_DE_RECEPCIONISTA = new ParseIntPipe({
  exceptionFactory: () => new RecepcionistaNoEncontradaError(),
});
