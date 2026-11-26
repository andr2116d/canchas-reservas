import { IsIn } from 'class-validator';
import type { EstadoUsuario } from '../../../../compartido/dominio/rol-usuario';

export const ESTADOS_DEL_LISTADO = {
  activas: 'ACTIVO',
  desactivadas: 'INACTIVO',
} as const satisfies Record<string, EstadoUsuario>;

/** Consulta de `GET /api/recepcionistas`. */
export class ListarRecepcionistasDto {
  @IsIn(Object.keys(ESTADOS_DEL_LISTADO), {
    message: 'Elige ver las activas o las desactivadas.',
  })
  estado: keyof typeof ESTADOS_DEL_LISTADO;
}
