import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/compartido/marco/seccion-en-preparacion";

export const metadata: Metadata = { title: "Reservar · La Previa" };

export default function PaginaDeReserva() {
  return <SeccionEnPreparacion titulo="Reservar" descripcion="Elige cancha, día y hora para tu próximo partido." />;
}
