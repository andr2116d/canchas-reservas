import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Publico } from './publico.decorator';

export const ADJUNTA_SESION_OPCIONAL = 'adjuntaSesionOpcional';

/**
 * Ruta pública que, si llega una sesión válida, la adjunta a la solicitud sin renovarla.
 * Sin sesión, o con una vencida, responde igual que cualquier ruta pública.
 */
export const SesionOpcional = () =>
  applyDecorators(Publico(), SetMetadata(ADJUNTA_SESION_OPCIONAL, true));
