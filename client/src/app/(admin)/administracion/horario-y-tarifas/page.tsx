import type { Metadata } from "next";
import { Suspense } from "react";
import { ProveedorDelBorrador } from "@/compartido/horario/borrador";
import { consultarHorario } from "@/compartido/horario/horario.servidor";
import { PanelDePestana, PestanasDeHorarioYTarifas, ProveedorDePestanas } from "@/compartido/horario/pestanas";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { FormularioDeHorario } from "@/features/horario/componentes/formulario-de-horario";
import { TarifasDelLocal } from "@/features/tarifas/componentes/tarifas-del-local";
import { TurnosDelDia } from "@/features/tarifas/componentes/turnos-del-dia";
import { consultarTarifas } from "@/features/tarifas/servicios/tarifas.servidor";

export const metadata: Metadata = { title: "Horario y tarifas · La Previa" };

/** Horario y tarifas en pestañas, con la vista previa de los turnos fija al costado. */
async function HorarioYTarifas() {
  const [horario, { tarifas }] = await Promise.all([consultarHorario(), consultarTarifas()]);
  return (
    <ProveedorDelBorrador>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0">
          <PanelDePestana pestana="horario">
            <FormularioDeHorario consultado={horario} />
          </PanelDePestana>
          <PanelDePestana pestana="tarifas">
            <TarifasDelLocal tarifas={tarifas} />
          </PanelDePestana>
        </div>
        <PanelDePestana pestana="turnos" className="lg:sticky lg:top-24">
          <TurnosDelDia />
        </PanelDePestana>
      </div>
    </ProveedorDelBorrador>
  );
}

export default function PaginaDeHorarioYTarifas() {
  return (
    <ProveedorDePestanas>
      <EncabezadoDeSeccion
        titulo="Horario y tarifas"
        descripcion="Cuándo se puede jugar y cuánto cuesta cada turno. Los jugadores solo verán turnos dentro de este horario."
        accion={<PestanasDeHorarioYTarifas />}
      />
      <Suspense fallback={<CargaDeContenido texto="Cargando horario y tarifas…" />}>
        <HorarioYTarifas />
      </Suspense>
    </ProveedorDePestanas>
  );
}
