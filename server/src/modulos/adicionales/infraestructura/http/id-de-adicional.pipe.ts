import { ParseIntPipe } from '@nestjs/common';
import { AdicionalNoEncontradoError } from '../../dominio/adicional-no-encontrado.error';

/** Lee el id de la ruta; uno que no es número responde igual que uno que no existe. */
export const ID_DE_ADICIONAL = new ParseIntPipe({
  exceptionFactory: () => new AdicionalNoEncontradoError(),
});
