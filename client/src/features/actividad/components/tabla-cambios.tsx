import { Badge, Table, type ColumnaTabla } from "@/components/ui";
import { fechaHoraEnLima } from "@/lib/formato";
import type { ItemCambio } from "../api";
import { accion, etiquetaEntidad, textoCambio } from "../formato";
import { CeldaUsuario } from "./celda-usuario";

function Detalle({ item }: { item: ItemCambio }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      {item.cambios.length === 0 ? (
        <span className="text-texto-suave">Sin cambios</span>
      ) : (
        <ul className="flex flex-col gap-1">
          {item.cambios.map((cambio) => (
            <li key={cambio.campo} className="break-words tabular-nums">
              {textoCambio(cambio)}
            </li>
          ))}
        </ul>
      )}
      {item.motivo && <span className="text-texto-suave">Motivo: {item.motivo}</span>}
    </div>
  );
}

const COLUMNAS: ColumnaTabla<ItemCambio>[] = [
  {
    titulo: "Fecha y hora",
    celda: (item) => fechaHoraEnLima(item.fecha),
    className: "whitespace-nowrap tabular-nums",
  },
  { titulo: "Usuario", celda: (item) => <CeldaUsuario usuario={item.usuario} vacio="Sistema" /> },
  {
    titulo: "Acción",
    celda: (item) => {
      const { etiqueta, tono } = accion(item.accion);
      return <Badge tono={tono}>{etiqueta}</Badge>;
    },
  },
  {
    titulo: "Qué",
    celda: (item) => (
      <div className="flex flex-col">
        <span className="font-medium">{etiquetaEntidad(item.entidad)}</span>
        {item.referencia && <span className="break-words text-sm text-texto-suave">{item.referencia}</span>}
      </div>
    ),
  },
  { titulo: "Detalle", celda: (item) => <Detalle item={item} />, className: "min-w-64" },
];

export function TablaCambios({ items }: { items: ItemCambio[] }) {
  return <Table columnas={COLUMNAS} filas={items} claveFila={(item) => item.id} etiqueta="Cambios" />;
}
