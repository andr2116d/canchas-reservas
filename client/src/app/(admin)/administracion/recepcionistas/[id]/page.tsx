import type { Metadata } from "next";
import { Suspense } from "react";
import { FichaCompleta } from "@/features/recepcionistas/componentes/ficha-completa";

export const metadata: Metadata = { title: "Recepcionista · La Previa" };

export default function PaginaDeLaRecepcionista({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-grava">Cargando la ficha…</p>}>
      <FichaCompleta parametros={params} />
    </Suspense>
  );
}
