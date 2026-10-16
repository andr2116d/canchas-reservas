import { Badge, Table, type ColumnaTabla } from "@/components/ui";
import { fechaHoraEnLima } from "@/lib/formato";
import type { ItemAcceso } from "../api";
import { MOTIVOS_ACCESO } from "../formato";
import { CeldaUsuario } from "./celda-usuario";

const COLUMNAS: ColumnaTabla<ItemAcceso>[] = [
  {
    titulo: "Fecha y hora",
    celda: (item) => fechaHoraEnLima(item.fecha),
    className: "whitespace-nowrap tabular-nums",
  },
  { titulo: "Correo", celda: (item) => item.correo, className: "break-all" },
  { titulo: "Usuario", celda: (item) => <CeldaUsuario usuario={item.usuario} vacio="Sin cuenta" /> },
  {
    titulo: "Resultado",
    celda: (item) =>
      item.exito ? <Badge tono="exito">Entró</Badge> : <Badge tono="error">Rechazado</Badge>,
  },
  {
    titulo: "Motivo",
    celda: (item) => MOTIVOS_ACCESO[item.motivo] ?? <span className="text-texto-suave">—</span>,
  },
];

export function TablaAccesos({ items }: { items: ItemAcceso[] }) {
  return <Table columnas={COLUMNAS} filas={items} claveFila={(item) => item.id} etiqueta="Accesos" />;
}
