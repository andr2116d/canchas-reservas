import type { Correo } from '../../../src/modulos/correo/dominio/correo';

/** Reemplaza al envío de correos: guarda lo que se pidió enviar. */
export class CorreosDePrueba {
  readonly enviados: Correo[] = [];

  ejecutar(correo: Correo): Promise<void> {
    this.enviados.push(correo);
    return Promise.resolve();
  }
}
