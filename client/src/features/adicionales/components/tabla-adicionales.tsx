import { Badge, Button, Table, type ColumnaTabla } from "@/components/ui";
import { moneda } from "@/lib/formato";
import type { Adicional } from "../api";

type Props = {
  adicionales: Adicional[];
  activandoId?: number;
  onEditar: (adicional: Adicional) => void;
  onDesactivar: (adicional: Adicional) => void;
  onActivar: (adicional: Adicional) => void;
  onEliminar: (adicional: Adicional) => void;
};

const BOTON_FILA = "h-11 px-3 md:h-9";

export function TablaAdicionales({ adicionales, activandoId, onEditar, onDesactivar, onActivar, onEliminar }: Props) {
  const columnas: ColumnaTabla<Adicional>[] = [
    { titulo: "Nombre", celda: (a) => <span className="font-medium">{a.nombre}</span> },
    {
      titulo: "Precio",
      celda: (a) => <span className="tabular-nums">{moneda(a.precio)}</span>,
      className: "tabular-nums",
    },
    {
      titulo: "Estado",
      celda: (a) => <Badge tono={a.activo ? "exito" : "neutro"}>{a.activo ? "Activo" : "Inactivo"}</Badge>,
    },
    {
      titulo: "Acciones",
      celda: (a) => (
        <div className="flex flex-wrap gap-2">
          <Button variante="secundario" className={BOTON_FILA} onClick={() => onEditar(a)}>
            Editar
          </Button>
          {a.activo ? (
            <Button variante="secundario" className={BOTON_FILA} onClick={() => onDesactivar(a)}>
              Desactivar
            </Button>
          ) : (
            <Button
              variante="secundario"
              className={BOTON_FILA}
              cargando={activandoId === a.id}
              onClick={() => onActivar(a)}
            >
              Activar
            </Button>
          )}
          <Button variante="secundario" className={BOTON_FILA} onClick={() => onEliminar(a)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return <Table etiqueta="Adicionales" columnas={columnas} filas={adicionales} claveFila={(a) => a.id} />;
}