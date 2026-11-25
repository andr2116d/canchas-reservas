import type { EnviadorDeCorreo } from '../../../src/modulos/correo/aplicacion/enviador-de-correo.port';
import type { Correo } from '../../../src/modulos/correo/dominio/correo';

/** Guarda lo que se envía y puede simular que el servidor de correo no responde. */
export class EnviadorDeCorreoDePrueba implements EnviadorDeCorreo {
  readonly enviados: Correo[] = [];
  private fallasPendientes = 0;

  fallarLasProximas(veces: number): void {
    this.fallasPendientes = veces;
  }

  enviar(correo: Correo): Promise<void> {
    if (this.fallasPendientes > 0) {
      this.fallasPendientes--;
      return Promise.reject(new Error('El servidor de correo no respondió.'));
    }
    this.enviados.push({ ...correo });
    return Promise.resolve();
  }
}
