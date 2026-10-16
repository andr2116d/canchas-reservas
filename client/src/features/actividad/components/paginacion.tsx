import { Button } from "@/components/ui";

type Props = {
  pagina: number;
  tamano: number;
  total: number;
  cargando?: boolean;
  onCambiar: (pagina: number) => void;
};

export function Paginacion({ pagina, tamano, total, cargando, onCambiar }: Props) {
  const paginas = Math.max(1, Math.ceil(total / tamano));
  return (
    <nav aria-label="Paginación" className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-texto-suave tabular-nums">
        Página {pagina} de {paginas} · {total} {total === 1 ? "registro" : "registros"}
      </p>
      <div className="flex gap-2">
        <Button variante="secundario" disabled={cargando || pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
          Anterior
        </Button>
        <Button variante="secundario" disabled={cargando || pagina >= paginas} onClick={() => onCambiar(pagina + 1)}>
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
