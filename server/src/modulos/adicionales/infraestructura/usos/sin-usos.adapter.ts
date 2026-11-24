import { Injectable } from '@nestjs/common';
import type { UsosDeAdicional } from '../../aplicacion/usos-de-adicional.port';

/**
 * El sistema todavía no entrega ni cobra adicionales, así que ninguno se usó.
 * Se reemplaza por el adaptador que consulte las entregas cuando existan.
 */
@Injectable()
export class SinUsosAdapter implements UsosDeAdicional {
  conUsos(): Promise<Set<number>> {
    return Promise.resolve(new Set());
  }
}
