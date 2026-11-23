import type { Metadata } from "next";
import { Suspense } from "react";
import { CargaDelPanel } from "@/compartido/marco/carga-del-panel";
import { PanelDelPersonal } from "@/features/acceso/componentes/panel-del-personal";

export const metadata: Metadata = { title: "Administración · La Previa" };

export default function PaginaDeAdministracion() {
  return (
    <Suspense fallback={<CargaDelPanel />}>
      <PanelDelPersonal rol="ADMINISTRADOR" />
    </Suspense>
  );
}
