import type { Metadata } from "next";
import { Suspense } from "react";
import { PanelDelPersonal } from "@/features/acceso/componentes/panel-del-personal";

export const metadata: Metadata = { title: "Administración · La Previa" };

export default function PaginaDeAdministracion() {
  return (
    <Suspense fallback={null}>
      <PanelDelPersonal rol="ADMINISTRADOR" />
    </Suspense>
  );
}
