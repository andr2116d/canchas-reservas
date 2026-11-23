import { consultarHorario } from "@/compartido/horario/horario.servidor";
import { consultarTarifas } from "../servicios/tarifas.servidor";
import { TarjetaDeTarifa } from "./tarjeta-de-tarifa";
import { TurnosDelDia } from "./turnos-del-dia";

/** Tarifa de cada tipo de cancha con los turnos que salen del horario guardado. */
export async function TarifasDelLocal() {
  const [{ tarifas }, { vigente }] = await Promise.all([consultarTarifas(), consultarHorario()]);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {tarifas.map((tarifa) => (
          <TarjetaDeTarifa key={tarifa.tipo} tarifa={tarifa} horario={vigente} />
        ))}
      </div>
      <TurnosDelDia />
    </div>
  );
}
