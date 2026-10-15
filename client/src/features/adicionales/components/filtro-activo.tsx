import { Select } from "@/components/ui";
import type { FiltroAdicional } from "../api";

type Props = {
  valor?: FiltroAdicional;
  onCambiar: (filtro?: FiltroAdicional) => void;
};

export function FiltroActivo({ valor, onCambiar }: Props) {
  return (
    <div className="w-full sm:w-56">
      <Select
        etiqueta="Estado"
        value={valor ?? ""}
        onChange={(evento) => onCambiar((evento.target.value || undefined) as FiltroAdicional | undefined)}
      >
        <option value="">Todos</option>
        <option value="activos">Activos</option>
        <option value="inactivos">Inactivos</option>
      </Select>
    </div>
  );
}