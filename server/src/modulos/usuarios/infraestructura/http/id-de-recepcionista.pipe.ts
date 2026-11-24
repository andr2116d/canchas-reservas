import { idDeRuta } from '../../../../compartido/infraestructura/http/id-de-ruta.pipe';
import { RecepcionistaNoEncontradaError } from '../../dominio/recepcionista-no-encontrada.error';

/** Id de la ruta; uno inválido responde igual que uno que no existe. */
export const ID_DE_RECEPCIONISTA = idDeRuta(
  () => new RecepcionistaNoEncontradaError(),
);
