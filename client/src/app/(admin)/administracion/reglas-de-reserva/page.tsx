import type { Metadata } from "next";
import { Suspense } from "react";
import { ProveedorDelBorrador } from "@/compartido/horario/borrador";
import { consultarHorario } from "@/compartido/horario/horario.servidor";
import { PanelDePestana, PestanasDeHorarioYTarifas, ProveedorDePestanas } from "@/compartido/horario/pestanas";
import { TarjetaDelAdelanto } from "@/features/adelanto/componentes/tarjeta-del-adelanto";
import { consultarAdelanto } from "@/features/adelanto/servicios/adelanto.servidor";
import { TarjetaDelPlazo } from "@/features/plazo-de-pago/componentes/tarjeta-del-plazo";
import { consultarPlazo } from "@/features/plazo-de-pago/servicios/plazo-de-pago.servidor";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { FormularioDeRegla } from "@/features/cancelacion/componentes/formulario-de-regla";
import { ProveedorDeLaRegla } from "@/features/cancelacion/componentes/proveedor-de-la-regla";
import { SimuladorDeCancelacion } from "@/features/cancelacion/componentes/simulador-de-cancelacion";
import { consultarRegla } from "@/features/cancelacion/servicios/cancelacion.servidor";
import { FormularioDeHorario } from "@/features/horario/componentes/formulario-de-horario";
import { TarifasDelLocal } from "@/features/tarifas/componentes/tarifas-del-local";
import { TurnosDelDia } from "@/features/tarifas/componentes/turnos-del-dia";
import { consultarTarifas } from "@/features/tarifas/servicios/tarifas.servidor";

export const metadata: Metadata = { title: "Reglas de reserva · La Previa" };

/** Horario, tarifas y cancelación en pestañas; al costado, la vista previa de la pestaña elegida. */
async function ReglasDeReserva() {
  const [horario, { tarifas }, regla, adelanto, plazo] = await Promise.all([
    consultarHorario(),
    consultarTarifas(),
    consultarRegla(),
    consultarAdelanto(),
    consultarPlazo(),
  ]);
  return (
    <ProveedorDelBorrador>
      <ProveedorDeLaRegla>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0">
            <PanelDePestana pestana="horario"><FormularioDeHorario consultado={horario} /></PanelDePestana>
            <PanelDePestana pestana="tarifas">
              <div className="flex flex-col gap-6">
                <TarifasDelLocal tarifas={tarifas} />
                <TarjetaDelAdelanto consultado={adelanto} />
                <TarjetaDelPlazo consultado={plazo} />
              </div>
            </PanelDePestana>
            <PanelDePestana pestana="cancelacion"><FormularioDeRegla consultada={regla} /></PanelDePestana>
          </div>
          <div className="lg:sticky lg:top-24">
            <PanelDePestana pestana="turnos"><TurnosDelDia /></PanelDePestana>
            <PanelDePestana pestana="simulador"><SimuladorDeCancelacion /></PanelDePestana>
          </div>
        </div>
      </ProveedorDeLaRegla>
    </ProveedorDelBorrador>
  );
}

export default function PaginaDeReglasDeReserva() {
  return (
    <ProveedorDePestanas>
      <EncabezadoDeSeccion
        titulo="Reglas de reserva"
        descripcion="Cuándo se juega, cuánto cuesta y qué pasa si alguien cancela. Cada cambio rige para las reservas nuevas."
        accion={<PestanasDeHorarioYTarifas />}
      />
      <Suspense fallback={<CargaDeContenido texto="Cargando reglas de reserva…" />}>
        <ReglasDeReserva />
      </Suspense>
    </ProveedorDePestanas>
  );
}
