import { createTransport, type Transporter } from 'nodemailer';
import type { EnviadorDeCorreo } from '../../aplicacion/enviador-de-correo.port';
import type { Correo } from '../../dominio/correo';
import type { ConfiguracionDeCorreo } from './configuracion-de-correo';

const PUERTO_CON_TLS_DIRECTO = 465;
const SEGUNDOS_DE_ESPERA = 20;

/** Envía por SMTP: Mailpit en desarrollo y el proveedor del local en producción. */
export class SmtpEnviadorDeCorreoAdapter implements EnviadorDeCorreo {
  private readonly transporte: Transporter;

  constructor(private readonly configuracion: ConfiguracionDeCorreo) {
    const { servidor, puerto, usuario, contrasena, exigirTls } = configuracion;
    this.transporte = createTransport({
      host: servidor,
      port: puerto,
      secure: puerto === PUERTO_CON_TLS_DIRECTO,
      requireTLS: exigirTls,
      auth: usuario ? { user: usuario, pass: contrasena } : undefined,
      connectionTimeout: SEGUNDOS_DE_ESPERA * 1000,
      greetingTimeout: SEGUNDOS_DE_ESPERA * 1000,
      socketTimeout: SEGUNDOS_DE_ESPERA * 1000,
    });
  }

  async enviar(correo: Correo): Promise<void> {
    await this.transporte.sendMail({
      from: this.configuracion.remitente,
      to: correo.para,
      subject: correo.asunto,
      text: correo.texto,
      html: correo.html,
    });
  }
}
