import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { BOTON_SOBRE_CANCHA } from "@/compartido/ui/estilos";
import { MisHojas } from "@/features/libro-de-reclamaciones/componentes/mis-hojas";
import { consultarMisHojas } from "@/features/libro-de-reclamaciones/servicios/libro.servidor";

export const metadata: Metadata = { title: "Mis reclamos · La Previa" };

const ENCABEZADO = (
  <EncabezadoDeSeccion
    titulo="Mis reclamos"
    descripcion="Las hojas del Libro de Reclamaciones que registraste con tu cuenta."
    accion={<Link href="/libro-de-reclamaciones" className={BOTON_SOBRE_CANCHA}>Registrar uno nuevo</Link>}
  />
);

async function HojasCargadas() {
  return <MisHojas hojas={await consultarMisHojas()} />;
}

export default function PaginaDeMisReclamos() {
  return (
    <>
      {ENCABEZADO}
      <Suspense fallback={<CargaDeContenido texto="Cargando tus reclamos…" />}>
        <HojasCargadas />
      </Suspense>
    </>
  );
}
