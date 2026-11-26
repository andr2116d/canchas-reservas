import type { Correo } from '../dominio/correo';

export const ENVIADOR_DE_CORREO = Symbol('ENVIADOR_DE_CORREO');

/** Entrega un correo al servidor de correo. Falla si el servidor no lo acepta. */
export interface EnviadorDeCorreo {
  enviar(correo: Correo): Promise<void>;
}
