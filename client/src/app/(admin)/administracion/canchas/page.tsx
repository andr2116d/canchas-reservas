import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/compartido/marco/seccion-en-preparacion";

export const metadata: Metadata = { title: "Canchas · La Previa" };

export default function PaginaDeCanchas() {
  return <SeccionEnPreparacion titulo="Canchas" descripcion="Las canchas del local, sus horarios y sus precios." />;
}
