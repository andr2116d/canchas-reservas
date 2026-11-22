import type { Metadata } from "next";
import { Suspense } from "react";
import { EsperaDeCancha } from "@/compartido/ui/espera-de-cancha";
import { Bienvenida } from "@/features/inicio/componentes/bienvenida";

export const metadata: Metadata = { title: "Inicio · La Previa" };

export default function PaginaInicio() {
  return (
    <Suspense fallback={<EsperaDeCancha />}>
      <Bienvenida />
    </Suspense>
  );
}
