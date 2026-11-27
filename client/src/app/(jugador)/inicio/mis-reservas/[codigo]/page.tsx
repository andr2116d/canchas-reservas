import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { ReservaSeparada } from "@/features/reservas/componentes/reserva-separada";
import { consultarMiReserva } from "@/features/reservas/servicios/reservas.servidor";

export const metadata: Metadata = { title: "Tu reserva · La Previa" };

type Parametros = Promise<{ codigo: string }>;

async function ReservaCargada({ parametros }: { parametros: Parametros }) {
  const { codigo } = await parametros;
  return <ReservaSeparada reserva={await consultarMiReserva(codigo)} />;
}

export default function PaginaDeMiReserva({ params }: { params: Parametros }) {
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Tu reserva"
        descripcion="Muestra el código en el local. Aquí ves cuánto falta para pagar el adelanto."
        accion={<Link href="/inicio/reservar" className="font-bold text-capitan underline underline-offset-2">Reservar otro turno</Link>}
      />
      <Suspense fallback={<CargaDeContenido texto="Cargando tu reserva…" />}>
        <ReservaCargada parametros={params} />
      </Suspense>
    </>
  );
}
