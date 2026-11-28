import type { Metadata } from "next";
import { PaginaDeLaAgenda } from "@/features/agenda/componentes/pagina-de-la-agenda";

export const metadata: Metadata = { title: "Agenda · La Previa" };

export default function PaginaDeAgenda() {
  return <PaginaDeLaAgenda ruta="/recepcion" />;
}
