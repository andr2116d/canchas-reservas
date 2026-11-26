import type { Metadata } from "next";
import { Suspense } from "react";
import { EsperaDeCancha } from "@/compartido/ui/espera-de-cancha";
import { PantallaDeDatos } from "@/features/cuenta/componentes/pantalla-de-datos";

export const metadata: Metadata = { title: "Tus datos · La Previa" };

export default function PaginaDeDatos() {
  return (
    <Suspense fallback={<EsperaDeCancha />}>
      <PantallaDeDatos />
    </Suspense>
  );
}
