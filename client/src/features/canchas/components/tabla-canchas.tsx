import { Badge, Button, Table, type ColumnaTabla } from "@/components/ui";
import { avisoSinTarifa, ETIQUETA_ESTADO, ETIQUETA_TAMANO, type Cancha } from "../api";

type Props = {
  canchas: Cancha[];
  activandoId?: number;
  onEditar: (cancha: Cancha) => void;
  onDesactivar: (cancha: Cancha) => void;
  onActivar: (cancha: Cancha) => void;
  onEliminar: (cancha: Cancha) => void;
};

const BOTON_FILA = "h-11 px-3 md:h-9";

export function TablaCanchas({ canchas, activandoId, onEditar, onDesactivar, onActivar, onEliminar }: Props) {
  const columnas: ColumnaTabla<Cancha>[] = [
    { titulo: "Nombre", celda: (c) => <span className="font-medium">{c.nombre}</span> },
    { titulo: "Tamaño", celda: (c) => ETIQUETA_TAMANO[c.tamano] },
    { titulo: "Iluminación", celda: (c) => (c.iluminacion ? "Sí" : "No") },
    {
      titulo: "Estado",
      celda: (c) => {
        const aviso = avisoSinTarifa(c.franjasSinTarifa);
        return (
          <div className="flex flex-wrap gap-2">
            <Badge tono={c.estado === "OPERATIVA" ? "exito" : "alerta"}>{ETIQUETA_ESTADO[c.estado]}</Badge>
            {!c.activa && <Badge tono="neutro">Desactivada</Badge>}
            {aviso && <Badge tono="alerta">{aviso}</Badge>}
          </div>
        );
      },
    },
    {
      titulo: "Acciones",
      celda: (c) => (
        <div className="flex flex-wrap gap-2">
          <Button variante="secundario" className={BOTON_FILA} onClick={() => onEditar(c)}>
            Editar
          </Button>
          {c.activa ? (
            <Button variante="secundario" className={BOTON_FILA} onClick={() => onDesactivar(c)}>
              Desactivar
            </Button>
          ) : (
            <Button
              variante="secundario"
              className={BOTON_FILA}
              cargando={activandoId === c.id}
              onClick={() => onActivar(c)}
            >
              Activar
            </Button>
          )}
          <Button variante="secundario" className={BOTON_FILA} onClick={() => onEliminar(c)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return <Table etiqueta="Canchas" columnas={columnas} filas={canchas} claveFila={(c) => c.id} />;
}
