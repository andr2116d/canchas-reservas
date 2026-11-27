import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { leerTurnoElegido } from "@/compartido/sesion/turno-elegido";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { ConfirmarReserva, TurnoNoDisponible } from "@/features/reservas/componentes/confirmar-reserva";

export const metadata: Metadata = { title: "Confirma tu reserva · La Previa" };

type Parametros = Promise<Record<string, string | string[] | undefined>>;

async function TurnoDeLaDireccion({ parametros }: { parametros: Parametros }) {
  const { cancha, fecha, desde } = await parametros;
  const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");
  const turno = leerTurnoElegido(new URLSearchParams({ cancha: texto(cancha), fecha: texto(fecha), desde: texto(desde) }));
  if (!turno) return <TurnoNoDisponible mensaje="No sabemos qué turno quieres reservar. Elígelo en el mapa." />;
  return <ConfirmarReserva turno={turno} />;
}

export default function PaginaDeConfirmacion({ searchParams }: { searchParams: Parametros }) {
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Confirma tu reserva"
        descripcion="Revisa el turno, la regla de cancelación y lo que pagas antes de separarlo."
        accion={<Link href="/inicio/reservar" className="font-bold text-capitan underline underline-offset-2">Volver al mapa</Link>}
      />
      <Suspense fallback={<CargaDeContenido texto="Cargando tu turno…" />}>
        <TurnoDeLaDireccion parametros={searchParams} />
      </Suspense>
    </>
  );
}
