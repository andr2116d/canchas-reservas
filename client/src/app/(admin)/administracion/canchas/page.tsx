import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { CanchasDelLocal } from "@/features/canchas/componentes/canchas-del-local";
import { consultarCambiosDeCanchas, consultarCanchas } from "@/features/canchas/servicios/canchas.servidor";
import { consultarTarifas } from "@/features/tarifas/servicios/tarifas.servidor";

export const metadata: Metadata = { title: "Canchas · La Previa" };

/** Canchas, sus cambios recientes y qué tamaños aún no tienen tarifa. */
async function CanchasCargadas() {
  const [canchas, cambios, { tarifas }] = await Promise.all([consultarCanchas(), consultarCambiosDeCanchas(), consultarTarifas()]);
  const tiposSinTarifa = tarifas.filter((tarifa) => !tarifa.vigente).map((tarifa) => tarifa.tipo);
  return <CanchasDelLocal canchas={canchas} cambios={cambios} tiposSinTarifa={tiposSinTarifa} />;
}

export default function PaginaDeCanchas() {
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Canchas"
        descripcion="Las canchas del local, cómo son y si se pueden reservar. El jugador ve estos datos antes de reservar."
      />
      <Suspense fallback={<CargaDeContenido texto="Cargando canchas…" />}>
        <CanchasCargadas />
      </Suspense>
    </>
  );
}
