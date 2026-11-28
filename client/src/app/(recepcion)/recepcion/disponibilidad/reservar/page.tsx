import type { Metadata } from "next";
import Link from "next/link";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { leerTurnoElegido } from "@/compartido/sesion/turno-elegido";
import { BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { ReservarEnRecepcion } from "@/features/reservas/componentes/reservar-en-recepcion";

export const metadata: Metadata = { title: "Reservar turno · La Previa" };

export default async function PaginaDeReservaEnRecepcion({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { cancha, fecha, desde } = await searchParams;
  const texto = (valor: unknown) => typeof valor === "string" ? valor : "";
  const turno = leerTurnoElegido(new URLSearchParams({ cancha: texto(cancha), fecha: texto(fecha), desde: texto(desde) }));

  return (
    <>
      <EncabezadoDeSeccion titulo="Reservar turno" accion={<Link className={BOTON_SECUNDARIO} href="/recepcion/disponibilidad">Volver al mapa</Link>} />
      {turno ? <ReservarEnRecepcion turno={turno} /> : <p role="alert" className="text-error">Elige un turno en el mapa para reservarlo.</p>}
    </>
  );
}
