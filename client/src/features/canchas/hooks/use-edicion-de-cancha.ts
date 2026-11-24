"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAvisar } from "@/compartido/ui/avisos-flotantes";
import { type CanchaEnEdicion, erroresDeCancha } from "../esquemas/cancha.schema";
import { editarCancha } from "../servicios/canchas.api";
import type { Cancha, Caracteristica, ReservaAfectada } from "../servicios/canchas";

export interface BorradorDeCancha extends CanchaEnEdicion {
  caracteristicas: Caracteristica[];
  nota: string;
}

type Problema = { mensaje: string; reservas?: ReservaAfectada[] };

/** Edición de una cancha: valida el formato, envía y muestra lo que responda el server. */
export function useEdicionDeCancha(cancha: Cancha, alTerminar: () => void) {
  const router = useRouter();
  const avisar = useAvisar();
  const [borrador, setBorrador] = useState<BorradorDeCancha>({ ...cancha, nota: cancha.nota ?? "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [problema, setProblema] = useState<Problema>();
  const [enviando, setEnviando] = useState(false);

  const cambiar = (cambios: Partial<BorradorDeCancha>) => setBorrador((actual) => ({ ...actual, ...cambios }));

  async function guardar() {
    const deFormato = erroresDeCancha(borrador);
    setErrores(deFormato);
    setProblema(undefined);
    if (Object.keys(deFormato).length > 0 || !borrador.tipo || borrador.tieneIluminacion === null) return;
    setEnviando(true);
    const { nombre, tipo, tieneIluminacion, caracteristicas, nota } = borrador;
    const resultado = await editarCancha(cancha.id, { nombre: nombre.trim(), tipo, tieneIluminacion, caracteristicas, nota });
    setEnviando(false);
    if (resultado.tipo === "guardada") {
      avisar(`Se guardaron los cambios de ${resultado.cancha.nombre}.`);
      router.refresh();
      alTerminar();
    } else if (resultado.tipo === "datos-rechazados") setErrores(resultado.errores);
    else setProblema(resultado);
  }

  return { borrador, cambiar, errores, problema, enviando, guardar };
}
