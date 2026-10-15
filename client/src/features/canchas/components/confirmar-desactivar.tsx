import { Button, Modal } from "@/components/ui";
import type { Cancha, ReservaFutura } from "../api";
import { ListaReservasAfectadas } from "./lista-reservas-afectadas";

type Props = {
  cancha: Cancha;
  reservas?: ReservaFutura[];
  abierto: boolean;
  enviando: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
};

export function ConfirmarDesactivar({ cancha, reservas, abierto, enviando, onCerrar, onConfirmar }: Props) {
  const conReservas = reservas !== undefined && reservas.length > 0;
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Desactivar cancha"
      acciones={
        <>
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" variante="peligro" cargando={enviando} onClick={onConfirmar}>
            {conReservas ? "Desactivar igual" : "Desactivar"}
          </Button>
        </>
      }
    >
      {conReservas ? (
        <div className="flex flex-col gap-3">
          <p className="text-texto-suave">
            <span className="font-medium text-texto">{cancha.nombre}</span> tiene{" "}
            {reservas.length === 1 ? "1 reserva futura" : `${reservas.length} reservas futuras`}. Si la desactivas, las
            reservas no se cancelan: tendrás que atenderlas después.
          </p>
          <ListaReservasAfectadas reservas={reservas} />
        </div>
      ) : (
        <p className="text-texto-suave">
          <span className="font-medium text-texto">{cancha.nombre}</span> dejará de aparecer en la disponibilidad y no
          aceptará nuevas reservas. Puedes volver a activarla cuando quieras.
        </p>
      )}
    </Modal>
  );
}
