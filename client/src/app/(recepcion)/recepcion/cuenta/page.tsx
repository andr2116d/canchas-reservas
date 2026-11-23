import type { Metadata } from "next";
import { Suspense } from "react";
import { CargaDelPanel } from "@/compartido/marco/carga-del-panel";
import { MiCuenta } from "@/features/cuenta/componentes/mi-cuenta";

export const metadata: Metadata = { title: "Mi cuenta · La Previa" };

export default function PaginaDeMiCuentaDeRecepcion() {
  return (
    <Suspense fallback={<CargaDelPanel />}>
      <MiCuenta rol="RECEPCIONISTA" />
    </Suspense>
  );
}
