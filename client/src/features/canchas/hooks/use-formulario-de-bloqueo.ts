"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAvisar } from "@/compartido/ui/avisos-flotantes";
import { aPedido, type BorradorDeBloqueo, erroresDelBloqueo } from "../esquemas/bloqueo.schema";
import { bloquearCanchas, type ResultadoDelBloqueo } from "../servicios/bloqueos.api";
import type { ReservaCruzada } from "../servicios/bloqueos";
import { partesEnLima } from "../utilidades/rango-en-lima";

const MS_POR_HORA = 60 * 60 * 1000;

export type Choque = Extract<ResultadoDelBloqueo, { tipo: "choca-con-reservas" | "choca-con-bloqueos" }>;

/** Empieza en la próxima hora en punto y dura dos horas. */
function borradorInicial(ahora: string): BorradorDeBloqueo {
  const proximaHora = Math.ceil(new Date(ahora).getTime() / MS_POR_HORA) * MS_POR_HORA;
  return {
    canchaIds: [],
    tipo: "PROGRAMADO",
    desde: partesEnLima(new Date(proximaHora)),
    hasta: partesEnLima(new Date(proximaHora + 2 * MS_POR_HORA)),
    motivo: "",
    repite: false,
    frecuencia: "SEMANAL",
    repiteHasta: "",
  };
}

const textoDelAviso = (bloqueos: { cancha: string }[]) =>
  bloqueos.length === 1 ? `${bloqueos[0].cancha} queda en mantenimiento en ese rango.` : `Se guardaron ${bloqueos.length} bloqueos.`;

/** Formulario de bloqueo: valida el formato, envía y muestra choques o reservas afectadas. */
export function useFormularioDeBloqueo(ahora: string) {
  const router = useRouter();
  const avisar = useAvisar();
  const [borrador, setBorrador] = useState(() => borradorInicial(ahora));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [choque, setChoque] = useState<Choque>();
  const [afectadas, setAfectadas] = useState<ReservaCruzada[]>([]);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (cambios: Partial<BorradorDeBloqueo>) => setBorrador((actual) => ({ ...actual, ...cambios }));

  async function enviar() {
    const deFormato = erroresDelBloqueo(borrador);
    setErrores(deFormato);
    setChoque(undefined);
    setAfectadas([]);
    if (Object.keys(deFormato).length > 0) return;
    setEnviando(true);
    const resultado = await bloquearCanchas(aPedido(borrador));
    setEnviando(false);
    if (resultado.tipo === "creados") {
      avisar(textoDelAviso(resultado.bloqueos));
      setAfectadas(resultado.reservasAfectadas);
      cambiar({ motivo: "" });
      router.refresh();
    } else if (resultado.tipo === "datos-rechazados") setErrores(resultado.errores);
    else if (resultado.tipo === "error") setErrores({ general: resultado.mensaje });
    else setChoque(resultado);
  }

  return { borrador, cambiar, errores, choque, afectadas, enviando, enviar };
}
