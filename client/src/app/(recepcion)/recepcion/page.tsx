import type { Metadata } from "next";
import { Suspense } from "react";
import { EsperaDeCancha } from "@/compartido/ui/espera-de-cancha";
import { PanelDelPersonal } from "@/features/acceso/componentes/panel-del-personal";

export const metadata: Metadata = { title: "Recepción · La Previa" };

export default function PaginaDeRecepcion() {
  return (
    <Suspense fallback={<EsperaDeCancha />}>
      <PanelDelPersonal rol="RECEPCIONISTA" />
    </Suspense>
  );
}
