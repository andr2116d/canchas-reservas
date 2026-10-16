import { Badge, EmptyState, Table, type ColumnaTabla } from "@/components/ui";
import { fechaHoraEnLima, moneda } from "@/lib/formato";
import { ETIQUETA_FRANJA, type RegistroHistorial } from "../api";

const COLUMNAS: ColumnaTabla<RegistroHistorial>[] = [
  { titulo: "Franja", celda: (registro) => ETIQUETA_FRANJA[registro.franja] },
  {
    titulo: "Valor anterior",
    celda: (registro) => (registro.valorAnterior === null ? "—" : moneda(registro.valorAnterior)),
    className: "tabular-nums",
  },
  { titulo: "Valor nuevo", celda: (registro) => moneda(registro.valor), className: "tabular-nums" },
  { titulo: "Cambiado por", celda: (registro) => registro.creadoPor?.nombre ?? "—" },
  { titulo: "Desde", celda: (registro) => fechaHoraEnLima(registro.vigenteDesde), className: "tabular-nums" },
  {
    titulo: "Hasta",
    celda: (registro) =>
      registro.vigenteHasta ? fechaHoraEnLima(registro.vigenteHasta) : <Badge tono="exito">Vigente</Badge>,
    className: "tabular-nums",
  },
];

export function TablaHistorial({ registros }: { registros: RegistroHistorial[] }) {
  if (registros.length === 0) return <EmptyState mensaje="Aún no hay cambios de tarifa" />;

  return (
    <Table columnas={COLUMNAS} filas={registros} claveFila={(registro) => registro.id} etiqueta="Historial de tarifas" />
  );
}
