import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EsperaDeCancha } from "@/compartido/ui/espera-de-cancha";

export const metadata: Metadata = {
  title: "Vista previa de la carga · La Previa",
  robots: { index: false, follow: false },
};

/** Muestra la pantalla de carga fija para revisarla. Solo existe en desarrollo. */
export default function VistaPreviaDeLaCarga() {
  if (process.env.NODE_ENV === "production") notFound();
  return <EsperaDeCancha />;
}
