"use client";

import { useState } from "react";
import { TablaHistorial, type FilaHistorial } from "./tabla-historial";
import { TarjetaFranja, type Franja, type TarifaVigente } from "./tarjeta-franja";

// ---------------------------------------------------------------------------
// DATOS DE EJEMPLO (solo para validar el diseño).
// Se eliminan en "Implementar la pantalla de tarifas", que los reemplaza por la API.
// ---------------------------------------------------------------------------
const CANCHAS_EJEMPLO = [
  { id: 1, nombre: "Cancha 1" },
  { id: 2, nombre: "Cancha 2" },
  { id: 3, nombre: "Cancha 3" },
];
const VIGENTES_EJEMPLO: Record<Franja, TarifaVigente | null> = {
  DIA: { valor: 60, desde: "01/09/2026" },
  NOCHE: { valor: 80, desde: "15/09/2026" },
};
const HISTORIAL_EJEMPLO: FilaHistorial[] = [
  { id: 5, franja: "NOCHE", valor: 80, desde: "15/09/2026", hasta: null },
  { id: 4, franja: "DIA", valor: 60, desde: "01/09/2026", hasta: null },
  { id: 3, franja: "NOCHE", valor: 75.5, desde: "10/08/2026", hasta: "15/09/2026" },
  { id: 2, franja: "DIA", valor: 55.05, desde: "10/08/2026", hasta: "01/09/2026" },
  { id: 1, franja: "NOCHE", valor: 70, desde: "01/07/2026", hasta: "10/08/2026" },
];
// ---------------------------------------------------------------------------

type ErroresFranja = Partial<Record<Franja, string>>;

export function PantallaTarifas() {
  const [canchaId, setCanchaId] = useState(CANCHAS_EJEMPLO[0].id);
  const [errores, setErrores] = useState<ErroresFranja>({});

  // Solo para ver el estado de error. La validación real (Zod) y el guardado
  // se hacen en "Implementar la pantalla de tarifas".
  const guardar = (franja: Franja, texto: string) => {
    const valor = Number(texto.replace(",", "."));
    setErrores((previos) => ({
      ...previos,
      [franja]: valor > 0 ? undefined : "El valor debe ser mayor que 0",
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">Tarifas</h1>
        <div className="flex flex-col gap-1 sm:w-64">
          <label htmlFor="cancha-tarifas" className="text-sm font-medium text-noche-900">
            Cancha
          </label>
          <select
            id="cancha-tarifas"
            value={canchaId}
            onChange={(e) => setCanchaId(Number(e.target.value))}
            className="w-full rounded-lg border border-noche-900/15 bg-transparent px-3 py-2 text-noche-900 focus:outline-none focus:ring-2 focus:ring-noche-900/30"
          >
            {CANCHAS_EJEMPLO.map((cancha) => (
              <option key={cancha.id} value={cancha.id}>
                {cancha.nombre}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TarjetaFranja
          key={`${canchaId}-DIA`}
          franja="DIA"
          vigente={VIGENTES_EJEMPLO.DIA}
          error={errores.DIA}
          onGuardar={(texto) => guardar("DIA", texto)}
        />
        <TarjetaFranja
          key={`${canchaId}-NOCHE`}
          franja="NOCHE"
          vigente={VIGENTES_EJEMPLO.NOCHE}
          error={errores.NOCHE}
          onGuardar={(texto) => guardar("NOCHE", texto)}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold text-noche-900">Historial</h2>
        <TablaHistorial filas={HISTORIAL_EJEMPLO} />
      </section>
    </div>
  );
}