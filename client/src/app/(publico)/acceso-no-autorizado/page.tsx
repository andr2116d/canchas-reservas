import type { Metadata } from "next";
import { Suspense } from "react";
import { AccesoDenegado } from "@/features/acceso/componentes/acceso-denegado";

export const metadata: Metadata = { title: "Acceso no autorizado · La Previa" };

export default function PaginaDeAccesoDenegado() {
  return (
    <Suspense fallback={null}>
      <AccesoDenegado />
    </Suspense>
  );
}
