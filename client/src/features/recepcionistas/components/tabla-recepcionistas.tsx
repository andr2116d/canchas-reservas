import { Badge, Button, Table, type ColumnaTabla } from "@/components/ui";
import { nombreCompleto, type Recepcionista } from "../api";

type Props = {
  recepcionistas: Recepcionista[];
  activandoId?: number;
  onEditar: (recepcionista: Recepcionista) => void;
  onDesactivar: (recepcionista: Recepcionista) => void;
  onActivar: (recepcionista: Recepcionista) => void;
  onRestablecer: (recepcionista: Recepcionista) => void;
};

const BOTON_FILA = "h-11 px-3 md:h-9";

export function TablaRecepcionistas({
  recepcionistas,
  activandoId,
  onEditar,
  onDesactivar,
  onActivar,
  onRestablecer,
}: Props) {
  const columnas: ColumnaTabla<Recepcionista>[] = [
    { titulo: "Nombre", celda: (r) => <span className="font-medium">{nombreCompleto(r)}</span> },
    { titulo: "Documento", celda: (r) => `${r.tipoDocumento} ${r.numeroDocumento}`, className: "tabular-nums" },
    { titulo: "Correo", celda: (r) => r.correo, className: "break-all" },
    { titulo: "Teléfono", celda: (r) => r.telefono, className: "tabular-nums" },
    {
      titulo: "Estado",
      celda: (r) =>
        r.estado === "ACTIVO" ? <Badge tono="exito">Activo</Badge> : <Badge tono="neutro">Inactivo</Badge>,
    },
    {
      titulo: "Acciones",
      celda: (r) => (
        <div className="flex flex-wrap gap-2">
          <Button variante="secundario" className={BOTON_FILA} onClick={() => onEditar(r)}>
            Editar
          </Button>
          {r.estado === "ACTIVO" ? (
            <Button variante="secundario" className={BOTON_FILA} onClick={() => onDesactivar(r)}>
              Desactivar
            </Button>
          ) : (
            <Button
              variante="secundario"
              className={BOTON_FILA}
              cargando={activandoId === r.id}
              onClick={() => onActivar(r)}
            >
              Activar
            </Button>
          )}
          <Button variante="secundario" className={BOTON_FILA} onClick={() => onRestablecer(r)}>
            Restablecer contraseña
          </Button>
        </div>
      ),
    },
  ];

  return <Table etiqueta="Recepcionistas" columnas={columnas} filas={recepcionistas} claveFila={(r) => r.id} />;
}
