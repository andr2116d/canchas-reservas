import { PelotaQueRebota } from "./pelota-que-rebota";

interface TextoDeEnvioProps {
  enviando: boolean;
  texto: string;
  textoAlEnviar: string;
}

/** Texto de un botón que envía algo: mientras espera, una pelotita rebota junto al texto. */
export function TextoDeEnvio({ enviando, texto, textoAlEnviar }: TextoDeEnvioProps) {
  if (!enviando) return texto;
  return (
    <span className="inline-flex items-center gap-2.5">
      <PelotaQueRebota tamano="boton" />
      {textoAlEnviar}
    </span>
  );
}
