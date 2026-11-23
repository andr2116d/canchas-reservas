import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { TarifasDelLocal } from "@/features/tarifas/componentes/tarifas-del-local";

export const metadata: Metadata = { title: "Tarifas · La Previa" };

export default function PaginaDeTarifas() {
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Tarifas"
        descripcion="Lo que cuesta un turno en cada tipo de cancha, de día y de noche. Un cambio rige para las reservas nuevas."
      />
      <Suspense fallback={<p className="text-grava">Cargando tarifas…</p>}>
        <TarifasDelLocal />
      </Suspense>
    </>
  );
}
