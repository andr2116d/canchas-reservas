import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { HorarioDelLocal } from "@/features/horario/componentes/horario-del-local";
import { TarifasDelLocal } from "@/features/tarifas/componentes/tarifas-del-local";

export const metadata: Metadata = { title: "Horario y tarifas · La Previa" };

export default function PaginaDeHorarioYTarifas() {
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Horario y tarifas"
        descripcion="Cuándo abre el local, cuánto dura y cuesta cada turno. Solo se ofrecen los turnos que caben en el horario; un cambio rige para las reservas nuevas."
      />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<p className="text-grava">Cargando horario…</p>}>
          <HorarioDelLocal />
        </Suspense>
        <Suspense fallback={<p className="text-grava">Cargando tarifas…</p>}>
          <TarifasDelLocal />
        </Suspense>
      </div>
    </>
  );
}
