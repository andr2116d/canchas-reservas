import { Button, Modal } from "@/components/ui";
import type { Adicional } from "../api";

type Props = {
  adicional: Adicional;
  abierto: boolean;
  enviando: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
};

export function ConfirmarEliminar({ adicional, abierto, enviando, onCerrar, onConfirmar }: Props) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Eliminar adicional"
      acciones={
        <>
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" variante="peligro" cargando={enviando} onClick={onConfirmar}>
            Eliminar
          </Button>
        </>
      }
    >
      <p className="text-texto-suave">
        ¿Seguro que quieres eliminar <span className="font-medium text-texto">{adicional.nombre}</span>? Esta acción no se
        puede deshacer.
      </p>
    </Modal>
  );
}