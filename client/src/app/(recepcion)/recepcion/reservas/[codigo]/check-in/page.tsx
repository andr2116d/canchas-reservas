import type { Metadata } from "next";
import Link from "next/link";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { CheckInDeReserva } from "@/features/reservas/componentes/check-in-de-reserva";

export const metadata: Metadata = { title: "Check-in · La Previa" };

export default async function PaginaDeCheckIn({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  return (
    <>
      <EncabezadoDeSeccion titulo="Hacer check-in" accion={<Link href="/recepcion" className={BOTON_SECUNDARIO}>Volver a la agenda</Link>} />
      <CheckInDeReserva key={codigo} codigo={codigo} />
    </>
  );
}
