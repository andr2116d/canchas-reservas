import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { BOTON_SOBRE_CANCHA } from "@/compartido/ui/estilos";
import { RecepcionistasDelEstado } from "@/features/recepcionistas/componentes/recepcionistas-del-estado";

export const metadata: Metadata = { title: "Recepcionistas · La Previa" };

export default function PaginaDeRecepcionistas({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string | string[] }>;
}) {
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Recepcionistas"
        descripcion="Quién opera la caja y las reservas. Las cuentas desactivadas conservan sus datos y su historial."
        accion={<Link href="/administracion/recepcionistas/nueva" className={BOTON_SOBRE_CANCHA}>Agregar recepcionista</Link>}
      />
      <Suspense fallback={<CargaDeContenido texto="Cargando recepcionistas…" />}>
        <RecepcionistasDelEstado parametros={searchParams} />
      </Suspense>
    </>
  );
}
