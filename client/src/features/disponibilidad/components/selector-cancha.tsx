"use client";

import { Select } from "@/components/ui/campo";
import type { Cancha } from "../api";

type Props = {
  canchas: Cancha[];
  canchaId: number | undefined;
  onCambiar: (canchaId: number | undefined) => void;
};

export function SelectorCancha({ canchas, canchaId, onCambiar }: Props) {
  return (
    <Select
      etiqueta="Cancha"
      className="w-[220px]"
      value={canchaId === undefined ? "" : String(canchaId)}
      onChange={(e) => {
        const valor = e.target.value;
        onCambiar(valor === "" ? undefined : Number(valor));
      }}
    >
      <option value="">Todas</option>
      {canchas.map((cancha) => (
        <option key={cancha.id} value={cancha.id}>
          {cancha.nombre}
        </option>
      ))}
    </Select>
  );
}
