import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { CatalogoDeAdicionales } from "@/features/adicionales/componentes/catalogo-de-adicionales";
import { consultarAdicionales, consultarCambiosDeAdicionales } from "@/features/adicionales/servicios/adicionales.servidor";

export const metadata: Metadata = { title: "Adicionales · La Previa" };

async function AdicionalesCargados() {
  const [adicionales, cambios] = await Promise.all([consultarAdicionales(), consultarCambiosDeAdicionales()]);
  return <CatalogoDeAdicionales adicionales={adicionales} cambios={cambios} />;
}

export default function PaginaDeAdicionales() {
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Adicionales"
        descripcion="Lo que el local presta en la cancha y cuánto se cobra por unidad si se pierde o se rompe. Un precio nuevo rige solo para los cobros que vengan."
      />
      <Suspense fallback={<CargaDeContenido texto="Cargando adicionales…" />}>
        <AdicionalesCargados />
      </Suspense>
    </>
  );
}
