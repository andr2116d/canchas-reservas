import type { Metadata } from "next";
import { Suspense } from "react";
import { CargaDelPanel } from "@/compartido/marco/carga-del-panel";
import { Bienvenida } from "@/features/inicio/componentes/bienvenida";

export const metadata: Metadata = { title: "Inicio · La Previa" };

export default function PaginaInicio() {
  return (
    <Suspense fallback={<CargaDelPanel />}>
      <Bienvenida />
    </Suspense>
  );
}
