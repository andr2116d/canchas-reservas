import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/compartido/marco/seccion-en-preparacion";

export const metadata: Metadata = { title: "Mis reservas · La Previa" };

export default function PaginaDeMisReservas() {
  return <SeccionEnPreparacion titulo="Mis reservas" descripcion="Tus partidos por jugar y los que ya jugaste." />;
}
