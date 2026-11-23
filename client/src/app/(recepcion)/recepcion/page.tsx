import type { Metadata } from "next";
import { Suspense } from "react";
import { CargaDelPanel } from "@/compartido/marco/carga-del-panel";
import { PanelDelPersonal } from "@/features/acceso/componentes/panel-del-personal";

export const metadata: Metadata = { title: "Recepción · La Previa" };

export default function PaginaDeRecepcion() {
  return (
    <Suspense fallback={<CargaDelPanel />}>
      <PanelDelPersonal rol="RECEPCIONISTA" />
    </Suspense>
  );
}
