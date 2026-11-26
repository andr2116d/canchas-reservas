import {
  fechaEnLima,
  leerFecha,
} from '../../../compartido/dominio/momento-en-lima';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import type { MedioDeRespuesta } from './opciones-de-la-hoja';
import { textoObligatorio } from './textos-de-la-hoja';

/** Las acciones adoptadas por el proveedor y cuándo se comunicaron. No se editan después. */
export interface RespuestaDeLaHoja {
  texto: string;
  respondidaEn: Date;
  /** Si la persona eligió carta: el día en que se envió (fecha de Lima). */
  cartaEnviadaEl: string | null;
}

export interface DatosDeLaRespuesta {
  texto: string;
  cartaEnviadaEl?: string;
}

const RESPUESTA = { nombre: 'la respuesta', maximo: 4000 };
const aTextoDePeru = (fecha: string) => fecha.split('-').reverse().join('/');

function leerFechaDeLaCarta(
  texto: string | undefined,
  registradaEl: string,
  hoy: string,
): string {
  if (!texto?.trim()) {
    throw new ValorInvalidoError('Ingresa la fecha en que se envió la carta.');
  }
  const fecha = leerFecha(texto);
  if (fecha < registradaEl) {
    throw new ValorInvalidoError(
      `La carta no puede haberse enviado antes de registrar la hoja (${aTextoDePeru(registradaEl)}).`,
    );
  }
  if (fecha > hoy) {
    throw new ValorInvalidoError('La fecha de envío no puede ser futura.');
  }
  return fecha;
}

/** Valida la respuesta según el medio que eligió la persona y la fecha en que se comunica. */
export function leerRespuesta(
  datos: DatosDeLaRespuesta,
  contexto: { medio: MedioDeRespuesta; registradaEn: Date; ahora: Date },
): RespuestaDeLaHoja {
  const { medio, registradaEn, ahora } = contexto;
  const leida = validarCampos({
    respuesta: () => textoObligatorio(datos.texto, RESPUESTA),
    cartaEnviadaEl: () =>
      medio === 'CARTA'
        ? leerFechaDeLaCarta(
            datos.cartaEnviadaEl,
            fechaEnLima(registradaEn),
            fechaEnLima(ahora),
          )
        : null,
  });
  return {
    texto: leida.respuesta,
    respondidaEn: ahora,
    cartaEnviadaEl: leida.cartaEnviadaEl,
  };
}

/** El día en que la respuesta llegó a la persona: el envío del correo o el de la carta. */
export function fechaDeComunicacion(respuesta: RespuestaDeLaHoja): string {
  return respuesta.cartaEnviadaEl ?? fechaEnLima(respuesta.respondidaEn);
}
