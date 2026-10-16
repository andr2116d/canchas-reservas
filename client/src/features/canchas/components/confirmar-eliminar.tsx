import { Alerta, Button, Modal } from "@/components/ui";
import type { Cancha, ReservaFutura } from "../api";
import { ListaReservasAfectadas } from "./lista-reservas-afectadas";

export type ConflictoEliminar = { motivo: string; reservas: ReservaFutura[] };

type Props = {
  cancha: Cancha;
  conflicto?: ConflictoEliminar;
  abierto: boolean;
  enviando: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
  onDesactivar: () => void;
};

export function ConfirmarEliminar({ cancha, conflicto, abierto, enviando, onCerrar, onConfirmar, onDesactivar }: Props) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Eliminar cancha"
      acciones={
        <>
          <Button type="button" variante="secundario" onClick={onCerrar}>
            {conflicto ? "Cerrar" : "Cancelar"}
          </Button>
          {!conflicto ? (
            <Button type="button" variante="peligro" cargando={enviando} onClick={onConfirmar}>
              Eliminar
            </Button>
          ) : (
            cancha.activa && (
              <Button type="button" variante="peligro" onClick={onDesactivar}>
                Desactivar cancha
              </Button>
            )
          )}
        </>
      }
    >
      {conflicto ? (
        <div className="flex flex-col gap-3">
          <Alerta>{conflicto.motivo}</Alerta>
          {conflicto.reservas.length > 0 && <ListaReservasAfectadas reservas={conflicto.reservas} />}
        </div>
      ) : (
        <p className="text-texto-suave">
          ¿Seguro que quieres eliminar <span className="font-medium text-texto">{cancha.nombre}</span>? Esta acción no se
          puede deshacer.
        </p>
      )}
    </Modal>
  );
}
