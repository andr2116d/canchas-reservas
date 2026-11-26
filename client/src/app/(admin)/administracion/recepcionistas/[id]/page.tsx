import type { Metadata } from "next";
import { Suspense } from "react";
import { FichaCompleta } from "@/features/recepcionistas/componentes/ficha-completa";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";

export const metadata: Metadata = { title: "Recepcionista · La Previa" };

export default function PaginaDeLaRecepcionista({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<CargaDeContenido texto="Cargando la ficha…" />}>
      <FichaCompleta parametros={params} />
    </Suspense>
  );
}
