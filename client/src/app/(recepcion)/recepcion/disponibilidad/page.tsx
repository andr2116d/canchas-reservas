import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/compartido/marco/seccion-en-preparacion";

export const metadata: Metadata = { title: "Disponibilidad · La Previa" };

export default function PaginaDeDisponibilidad() {
  return <SeccionEnPreparacion titulo="Disponibilidad" descripcion="Los turnos libres y ocupados de cada cancha." />;
}
