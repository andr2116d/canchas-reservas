import type { Metadata } from "next";
import { Suspense } from "react";
import { PantallaDeCambio } from "@/features/acceso/componentes/pantalla-de-cambio";

export const metadata: Metadata = { title: "Cambia tu contraseña · La Previa" };

export default function PaginaDeCambio() {
  return (
    <Suspense fallback={null}>
      <PantallaDeCambio />
    </Suspense>
  );
}
