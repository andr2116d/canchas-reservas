import type { Metadata } from "next";
import { PantallaDeAcceso } from "@/features/acceso/componentes/pantalla-de-acceso";

export const metadata: Metadata = { title: "Inicia sesión · La Previa" };

export default function PaginaDeAcceso({ searchParams }: PageProps<"/iniciar-sesion">) {
  return <PantallaDeAcceso parametros={searchParams} />;
}
