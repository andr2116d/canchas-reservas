import type { Metadata } from "next";
import { Suspense } from "react";
import { Bienvenida } from "@/features/inicio/componentes/bienvenida";

export const metadata: Metadata = { title: "Inicio · La Previa" };

export default function PaginaInicio() {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-grava">Cargando tu cuenta…</p>}>
      <Bienvenida />
    </Suspense>
  );
}
