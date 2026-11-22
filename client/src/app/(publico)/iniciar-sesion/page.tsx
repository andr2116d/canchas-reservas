import type { Metadata } from "next";
import { Suspense } from "react";
import { PantallaDeAcceso } from "@/features/acceso/componentes/pantalla-de-acceso";

export const metadata: Metadata = { title: "Inicia sesión · La Previa" };

export default function PaginaDeAcceso({ searchParams }: PageProps<"/iniciar-sesion">) {
  return (
    <Suspense fallback={null}>
      <PantallaDeAcceso parametros={searchParams} />
    </Suspense>
  );
}
