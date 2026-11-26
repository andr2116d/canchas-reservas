import type { Metadata } from "next";
import { Suspense } from "react";
import { ahoraDeLaPeticion } from "@/compartido/sesion/ahora-de-la-peticion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { CanchasDelLocal } from "@/features/canchas/componentes/canchas-del-local";
import { consultarCambiosDeCanchas, consultarCanchas } from "@/features/canchas/servicios/canchas.servidor";
import { partesEnLima } from "@/features/canchas/utilidades/rango-en-lima";
import { consultarTarifas } from "@/features/tarifas/servicios/tarifas.servidor";

export const metadata: Metadata = { title: "Canchas · La Previa" };

/** Canchas, sus cambios recientes, qué tamaños aún no tienen tarifa y la fecha de hoy en Lima. */
async function CanchasCargadas() {
  const [canchas, cambios, { tarifas }, ahora] = await Promise.all([
    consultarCanchas(),
    consultarCambiosDeCanchas(),
    consultarTarifas(),
    ahoraDeLaPeticion(),
  ]);
  const tiposSinTarifa = tarifas.filter((tarifa) => !tarifa.vigente).map((tarifa) => tarifa.tipo);
  return <CanchasDelLocal canchas={canchas} cambios={cambios} tiposSinTarifa={tiposSinTarifa} hoy={partesEnLima(ahora).fecha} />;
}

export default function PaginaDeCanchas() {
  return (
    <Suspense fallback={<CargaDeContenido texto="Cargando canchas…" />}>
      <CanchasCargadas />
    </Suspense>
  );
}
