/** Un correo del servicio listo para enviar: a quién, el asunto y el cuerpo en texto y en HTML. */
export interface Correo {
  para: string;
  asunto: string;
  texto: string;
  html: string;
}

/** Un correo guardado en la bandeja de salida, con los intentos que ya se hicieron. */
export interface CorreoEnCola extends Correo {
  id: number;
  intentos: number;
}
