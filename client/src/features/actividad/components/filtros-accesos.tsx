import { useEffect, useState } from "react";
import { Input, Select } from "@/components/ui";
import type { FiltrosAccesos as Filtros } from "../api";
import { RangoFechas } from "./rango-fechas";

const ESPERA_CORREO_MS = 300;

type Props = {
  filtros: Filtros;
  errores?: Record<string, string>;
  onCambiar: (cambios: Partial<Omit<Filtros, "pagina">>) => void;
};

export function FiltrosAccesos({ filtros, errores = {}, onCambiar }: Props) {
  const [correo, setCorreo] = useState(filtros.correo ?? "");

  useEffect(() => {
    const limpio = correo.trim() || undefined;
    if (limpio === filtros.correo) return;
    const espera = setTimeout(() => onCambiar({ correo: limpio }), ESPERA_CORREO_MS);
    return () => clearTimeout(espera);
  }, [correo, filtros.correo, onCambiar]);

  const resultado = filtros.exito === undefined ? "" : String(filtros.exito);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Select
        etiqueta="Resultado"
        value={resultado}
        error={errores.exito}
        onChange={(evento) => onCambiar({ exito: evento.target.value ? evento.target.value === "true" : undefined })}
      >
        <option value="">Todos</option>
        <option value="true">Entró</option>
        <option value="false">Rechazado</option>
      </Select>
      <Input
        etiqueta="Correo"
        type="search"
        placeholder="Busca por parte del correo"
        maxLength={120}
        value={correo}
        error={errores.correo}
        onChange={(evento) => setCorreo(evento.target.value)}
      />
      <RangoFechas desde={filtros.desde} hasta={filtros.hasta} errores={errores} onCambiar={onCambiar} />
    </div>
  );
}
