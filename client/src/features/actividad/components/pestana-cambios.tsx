"use client";

import { useState } from "react";
import { EmptyState, Spinner } from "@/components/ui";
import type { FiltrosCambios } from "../api";
import { useCambios } from "../hooks";
import { ErrorCarga } from "./error-carga";
import { TablaCambios } from "./tabla-cambios";

export function PestanaCambios() {
  const [filtros] = useState<FiltrosCambios>({ pagina: 1 });
  const cambios = useCambios(filtros);

  if (cambios.isPending) {
    return (
      <div role="status" aria-label="Cargando cambios" className="flex justify-center py-12 text-texto-suave">
        <Spinner className="size-6" />
      </div>
    );
  }
  if (cambios.isError) {
    return (
      <ErrorCarga
        mensaje={cambios.error.message}
        reintentando={cambios.isFetching}
        onReintentar={() => cambios.refetch()}
      />
    );
  }
  if (cambios.data.items.length === 0) return <EmptyState mensaje="No hay cambios registrados" />;
  return <TablaCambios items={cambios.data.items} />;
}
