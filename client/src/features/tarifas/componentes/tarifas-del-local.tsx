import { consultarTarifas } from "../servicios/tarifas.servidor";
import { SimuladorDeValor } from "./simulador-de-valor";
import { TarjetaDeTarifa } from "./tarjeta-de-tarifa";

/** Tarifa de cada tipo de cancha, lista para editar, y el simulador del valor de un turno. */
export async function TarifasDelLocal() {
  const { inicioDeLaNoche, tarifas } = await consultarTarifas();
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {tarifas.map((tarifa) => (
          <TarjetaDeTarifa key={tarifa.tipo} tarifa={tarifa} inicioDeLaNoche={inicioDeLaNoche} />
        ))}
      </div>
      <SimuladorDeValor inicioDeLaNoche={inicioDeLaNoche} />
    </div>
  );
}
