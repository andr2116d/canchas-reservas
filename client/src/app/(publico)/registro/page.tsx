import type { Metadata } from "next";
import { RegistroDeJugador } from "@/features/registro/componentes/registro-de-jugador";

export const metadata: Metadata = { title: "Crea tu cuenta · La Previa" };

export default function PaginaRegistro() {
  return <RegistroDeJugador />;
}
