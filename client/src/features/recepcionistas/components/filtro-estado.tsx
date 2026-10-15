import { Select } from "@/components/ui";
import type { EstadoUsuario } from "../api";

type Props = {
  valor?: EstadoUsuario;
  onCambiar: (estado?: EstadoUsuario) => void;
};

export function FiltroEstado({ valor, onCambiar }: Props) {
  return (
    <div className="w-full sm:w-56">
      <Select
        etiqueta="Estado"
        value={valor ?? ""}
        onChange={(evento) => onCambiar((evento.target.value || undefined) as EstadoUsuario | undefined)}
      >
        <option value="">Todos</option>
        <option value="ACTIVO">Activos</option>
        <option value="INACTIVO">Inactivos</option>
      </Select>
    </div>
  );
}
