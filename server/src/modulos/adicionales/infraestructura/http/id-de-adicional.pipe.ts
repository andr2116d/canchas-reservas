import { idDeRuta } from '../../../../compartido/infraestructura/http/id-de-ruta.pipe';
import { AdicionalNoEncontradoError } from '../../dominio/adicional-no-encontrado.error';

/** Id de la ruta; uno inválido responde igual que uno que no existe. */
export const ID_DE_ADICIONAL = idDeRuta(() => new AdicionalNoEncontradoError());
