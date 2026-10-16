import { Button, EmptyState } from "@/components/ui";

type Props = { mensaje: string; reintentando: boolean; onReintentar: () => void };

export function ErrorCarga({ mensaje, reintentando, onReintentar }: Props) {
  return (
    <div role="alert">
      <EmptyState
        mensaje={mensaje}
        accion={
          <Button variante="secundario" cargando={reintentando} onClick={onReintentar}>
            Reintentar
          </Button>
        }
      />
    </div>
  );
}
