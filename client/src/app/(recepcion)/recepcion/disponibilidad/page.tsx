import type { Metadata } from "next";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { MapaDeTurnos } from "@/features/disponibilidad/componentes/mapa-de-turnos";

export const metadata: Metadata = { title: "Disponibilidad · La Previa" };

export default function PaginaDeDisponibilidad() {
  return (
    <>
      <EncabezadoDeSeccion titulo="Disponibilidad" descripcion="Los turnos de cada cancha, al momento." />
      <MapaDeTurnos contexto="recepcion" />
    </>
  );
}
