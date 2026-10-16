import { Button, Modal } from "@/components/ui";
import { nombreCompleto, type Recepcionista } from "../api";

type Props = {
  recepcionista: Recepcionista;
  abierto: boolean;
  enviando: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
};

export function ConfirmarDesactivar({ recepcionista, abierto, enviando, onCerrar, onConfirmar }: Props) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Desactivar recepcionista"
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
        <span className="font-medium text-texto">
          {nombreCompleto(recepcionista)}
        </span>{" "}
        ya no podrá iniciar sesión. Su historial se conserva y puedes volver a activarlo cuando quieras.
      </p>
    </Modal>
  );
}
