import { Input } from "@/components/ui";

type Props = {
  desde?: string;
  hasta?: string;
  errores?: Record<string, string>;
  onCambiar: (rango: { desde?: string; hasta?: string }) => void;
};

export function RangoFechas({ desde, hasta, errores = {}, onCambiar }: Props) {
  return (
    <>
      <Input
        etiqueta="Desde"
        type="date"
        value={desde ?? ""}
        max={hasta}
        error={errores.desde}
        onChange={(evento) => onCambiar({ desde: evento.target.value || undefined })}
      />
      <Input
        etiqueta="Hasta"
        type="date"
        value={hasta ?? ""}
        min={desde}
        error={errores.hasta}
        onChange={(evento) => onCambiar({ hasta: evento.target.value || undefined })}
      />
    </>
  );
}
