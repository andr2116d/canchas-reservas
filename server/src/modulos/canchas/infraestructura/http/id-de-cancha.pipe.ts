import { idDeRuta } from '../../../../compartido/infraestructura/http/id-de-ruta.pipe';
import { CanchaNoEncontradaError } from '../../dominio/cancha-no-encontrada.error';

/** Id de la ruta; uno inválido responde igual que uno que no existe. */
export const ID_DE_CANCHA = idDeRuta(() => new CanchaNoEncontradaError());
