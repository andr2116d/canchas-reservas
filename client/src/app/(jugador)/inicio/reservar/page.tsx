import type { Metadata } from "next";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { MapaDeTurnos } from "@/features/disponibilidad/componentes/mapa-de-turnos";

export const metadata: Metadata = { title: "Reservar · La Previa" };

export default function PaginaDeReserva() {
  return (
    <>
      <EncabezadoDeSeccion titulo="Reservar" descripcion="Elige el día y toca un turno libre para ver su precio y su adelanto." />
      <MapaDeTurnos contexto="jugador" />
    </>
  );
}
