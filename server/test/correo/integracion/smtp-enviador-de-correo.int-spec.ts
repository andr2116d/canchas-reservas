import { randomUUID } from 'node:crypto';
import { leerConfiguracionDeCorreo } from '../../../src/modulos/correo/infraestructura/smtp/configuracion-de-correo';
import { SmtpEnviadorDeCorreoAdapter } from '../../../src/modulos/correo/infraestructura/smtp/smtp-enviador-de-correo.adapter';
import { correosRecibidosPor } from '../../compartido/soporte/bandeja-de-mailpit';
import { unCorreo } from '../fabricas/un-correo';

describe('SmtpEnviadorDeCorreoAdapter', () => {
  const enviador = new SmtpEnviadorDeCorreoAdapter(
    leerConfiguracionDeCorreo(process.env),
  );

  it('entrega el correo al servidor SMTP con el remitente, el asunto y los dos cuerpos', async () => {
    const para = `jugador.${randomUUID()}@gmail.com`;

    await enviador.enviar(unCorreo({ para }));

    expect(await correosRecibidosPor(para)).toEqual([
      {
        de: 'La Previa <avisos@laprevia.test>',
        para: [para],
        asunto: 'Hoja de reclamación N.º 000001-2026',
        texto: 'Registramos tu hoja.',
        html: expect.stringContaining('<p>Registramos tu hoja.</p>'),
      },
    ]);
  });

  it('falla si el servidor de correo no está disponible', async () => {
    const sinServidor = new SmtpEnviadorDeCorreoAdapter({
      ...leerConfiguracionDeCorreo(process.env),
      puerto: 1,
    });

    await expect(sinServidor.enviar(unCorreo())).rejects.toThrow();
  });
});
