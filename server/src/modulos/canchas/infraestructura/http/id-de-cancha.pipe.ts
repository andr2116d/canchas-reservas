import { ParseIntPipe } from '@nestjs/common';
import { CanchaNoEncontradaError } from '../../dominio/cancha-no-encontrada.error';

/** Lee el id de la ruta; uno que no es número responde igual que uno que no existe. */
export const ID_DE_CANCHA = new ParseIntPipe({
  exceptionFactory: () => new CanchaNoEncontradaError(),
});
