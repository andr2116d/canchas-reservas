import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { Correo } from '../../correo/dominio/correo';
import type { HojaDeReclamacion } from '../dominio/hoja-de-reclamacion.entity';
import type { HojaRepository } from '../dominio/hoja.repository';
import type { DatosDeLaRespuesta } from '../dominio/respuesta-de-la-hoja';
import { buscarHoja } from './buscar-hoja';
import { redactarCorreo } from './redaccion-de-correos';
import { fechaYHoraDeLima } from './textos-de-la-hoja-para-mostrar';

export interface DependenciasDeLaRespuesta {
  hojas: HojaRepository;
  correos: { ejecutar(correo: Correo): Promise<void> };
  reloj: Reloj;
}

function redactarRespuesta(hoja: HojaDeReclamacion) {
  const numero = hoja.numero!.texto;
  const { fecha } = fechaYHoraDeLima(hoja.registradaEn);
  return redactarCorreo(
    `Respuesta a tu hoja de reclamación N.º ${numero}`,
    `Respondimos tu hoja N.º ${numero}, registrada el ${fecha}.`,
    [
      ['Acciones adoptadas por La Previa', [hoja.respuesta!.texto]],
      [
        'Lo que registraste',
        [`Detalle: ${hoja.detalle}`, `Pedido: ${hoja.pedido}`],
      ],
    ],
  );
}

/**
 * Registra la respuesta (no se cambia después) y, si la persona eligió correo, se la envía a ella
 * y a quien la representa. Si eligió carta, administración la envía e indica la fecha.
 */
export class ResponderHojaUseCase {
  constructor(private readonly d: DependenciasDeLaRespuesta) {}

  async ejecutar(
    numero: string,
    datos: DatosDeLaRespuesta,
    administradorId: number,
  ): Promise<void> {
    const hoja = await buscarHoja(this.d.hojas, numero);
    hoja.responder(datos, this.d.reloj.ahora());
    await this.d.hojas.guardar(hoja, {
      accion: 'RESPUESTA',
      detalle: {
        medio: hoja.medioDeRespuesta,
        fueraDePlazo: hoja.fueraDePlazo,
      },
      ejecutadoPorId: administradorId,
      ocurridoEn: this.d.reloj.ahora(),
    });
    if (hoja.medioDeRespuesta === 'CORREO') await this.enviar(hoja);
  }

  private async enviar(hoja: HojaDeReclamacion): Promise<void> {
    const correo = redactarRespuesta(hoja);
    const destinatarios = new Set([
      hoja.consumidor.correo,
      hoja.representante?.correo,
    ]);
    for (const para of destinatarios) {
      if (para) await this.d.correos.ejecutar({ para, ...correo });
    }
  }
}
