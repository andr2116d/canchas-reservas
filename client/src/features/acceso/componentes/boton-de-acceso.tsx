import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";

/** Acción principal de los formularios de acceso. */
export function BotonDeAcceso({ enviando, texto, textoAlEnviar }: { enviando: boolean; texto: string; textoAlEnviar: string }) {
  return (
    <button type="submit" disabled={enviando} aria-busy={enviando} className="min-h-12 rounded-xl bg-botella px-5 py-3 font-bold text-papel hover:bg-botella-oscura focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botella disabled:opacity-60">
      <TextoDeEnvio enviando={enviando} texto={texto} textoAlEnviar={textoAlEnviar} />
    </button>
  );
}
