import { LimiteExcedidoError } from '../../../compartido/dominio/dominio.error';
import {
  inicioDeLaVentana,
  type LimiteDeCambios,
} from '../dominio/limites-de-cambios';
import type { UsuarioRepository } from '../dominio/usuario.repository';

/** Rechaza el cambio si la persona ya hizo el máximo permitido en la ventana del límite. */
export async function exigirLimite(
  usuarios: Pick<UsuarioRepository, 'contarAccionesPropias'>,
  usuarioId: number,
  limite: LimiteDeCambios,
  ahora: Date,
): Promise<void> {
  const hechos = await usuarios.contarAccionesPropias(
    usuarioId,
    limite.acciones,
    inicioDeLaVentana(limite, ahora),
  );
  if (hechos >= limite.maximo) throw new LimiteExcedidoError(limite.mensaje);
}
