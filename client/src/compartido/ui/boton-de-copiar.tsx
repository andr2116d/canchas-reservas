"use client";

import { useState } from "react";
import { BOTON_SECUNDARIO } from "./estilos";

const AVISOS = {
  listo: "",
  copiado: "Datos copiados. Pégalos en un mensaje para entregarlos.",
  fallo: "No se pudo copiar. Selecciona el texto y cópialo a mano.",
};

interface BotonDeCopiarProps {
  texto: () => string;
  etiqueta?: string;
  /** Qué dice tras copiar; por defecto, el de entregar credenciales al personal. */
  avisoCopiado?: string;
}

/** Copia al portapapeles el texto que arma `texto` al pulsar, y avisa si lo logró. */
export function BotonDeCopiar({ texto, etiqueta = "Copiar datos", avisoCopiado = AVISOS.copiado }: BotonDeCopiarProps) {
  const [estado, setEstado] = useState<keyof typeof AVISOS>("listo");
  const avisos = { ...AVISOS, copiado: avisoCopiado };

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto());
      setEstado("copiado");
    } catch {
      setEstado("fallo");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={copiar} className={BOTON_SECUNDARIO}>
        {etiqueta}
      </button>
      <p role="status" className="text-sm font-semibold text-botella">{avisos[estado]}</p>
    </div>
  );
}
