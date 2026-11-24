"use client";

import { FILTROS_INICIALES } from "../utilidades/filtros";
import { useConsultarHistorial } from "./consulta-del-historial";

/** Sin registros: lo dice y ofrece volver a ver todo. Si la página quedó fuera de rango, vuelve a la primera. */
export function HistorialVacio({ fueraDeRango }: { fueraDeRango: boolean }) {
  const consultar = useConsultarHistorial();
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <h2 className="font-titular text-2xl font-black text-tinta">
        {fueraDeRango ? "Esta página no tiene registros" : "No hay registros con estos filtros"}
      </h2>
      <p className="max-w-sm text-sm text-grava">
        {fueraDeRango ? "Vuelve a la primera página para ver los más recientes." : "Prueba con otras fechas o quita algún filtro."}
      </p>
      <button type="button" onClick={() => consultar(FILTROS_INICIALES)} className="mt-1 rounded-full border border-dashed border-botella px-4 py-1.5 text-sm font-bold text-botella hover:bg-botella/10">
        {fueraDeRango ? "Ir al inicio del historial" : "Limpiar filtros"}
      </button>
    </div>
  );
}
