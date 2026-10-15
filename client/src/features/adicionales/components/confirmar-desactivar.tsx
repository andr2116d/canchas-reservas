import { Button, Modal } from "@/components/ui";
import type { Adicional } from "../api";

type Props = {
  adicional: Adicional;
  abierto: boolean;
  enviando: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
};

export function ConfirmarDesactivar({ adicional, abierto, enviando, onCerrar, onConfirmar }: Props) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Desactivar adicional"
      acciones={
        <>
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" variante="peligro" cargando={enviando} onClick={onConfirmar}>
            Desactivar
          </Button>
        </>
      }
    >
      <p className="text-texto-suave">
        <span className="font-medium text-texto">{adicional.nombre}</span> dejará de ofrecerse al registrar consumos. Los
        cobros que ya lo incluyen no cambian. Puedes volver a activarlo cuando quieras.
      </p>
    </Modal>
  );
}