import { Select } from "@/components/ui";
import type { FiltrosCambios } from "../api";
import { ACCIONES, ENTIDADES } from "../formato";
import { RangoFechas } from "./rango-fechas";

type Props = {
  filtros: FiltrosCambios;
  errores?: Record<string, string>;
  onCambiar: (cambios: Partial<Omit<FiltrosCambios, "pagina">>) => void;
};

export function FiltrosCambios({ filtros, errores = {}, onCambiar }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Select
        etiqueta="Qué"
        value={filtros.entidad ?? ""}
        error={errores.entidad}
        onChange={(evento) => onCambiar({ entidad: evento.target.value || undefined })}
      >
        <option value="">Todo</option>
        {Object.entries(ENTIDADES).map(([valor, etiqueta]) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </Select>
      <Select
        etiqueta="Acción"
        value={filtros.accion ?? ""}
        error={errores.accion}
        onChange={(evento) => onCambiar({ accion: evento.target.value || undefined })}
      >
        <option value="">Todas</option>
        {Object.entries(ACCIONES).map(([valor, { etiqueta }]) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </Select>
      <RangoFechas desde={filtros.desde} hasta={filtros.hasta} errores={errores} onCambiar={onCambiar} />
    </div>
  );
}
