import { TARJETA } from "@/compartido/ui/estilos";
import type { TarifaDelTipo } from "../servicios/tarifas";
import { TarjetaDeTarifa } from "./tarjeta-de-tarifa";

/** Tarifa de cada tipo de cancha, lado a lado mientras haya espacio. */
export function TarifasDelLocal({ tarifas }: { tarifas: TarifaDelTipo[] }) {
  return (
    <section aria-labelledby="tarifas-titulo" className={`${TARJETA} flex flex-col gap-5`}>
      <header className="flex flex-col gap-1">
        <h2 id="tarifas-titulo" className="font-titular text-3xl font-black text-tinta">Tarifas por tipo de cancha</h2>
        <p className="max-w-[62ch] text-sm text-grava">
          Precio final de un turno completo, con IGV incluido. Un cambio rige para las reservas nuevas; las reservas ya hechas mantienen su precio.
        </p>
      </header>
      <div className="flex flex-wrap gap-4">
        {tarifas.map((tarifa) => (
          <TarjetaDeTarifa key={tarifa.tipo} tarifa={tarifa} />
        ))}
      </div>
    </section>
  );
}
