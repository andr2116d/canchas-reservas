"use client";

import { useState } from "react";
import { EmptyState, Spinner } from "@/components/ui";
import { ErrorApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { FiltrosCambios as Filtros } from "../api";
import { useCambios } from "../hooks";
import { ErrorCarga } from "./error-carga";
import { FiltrosCambios } from "./filtros-cambios";
import { Paginacion } from "./paginacion";
import { TablaCambios } from "./tabla-cambios";

export function PestanaCambios() {
  const [filtros, setFiltros] = useState<Filtros>({ pagina: 1 });
  const cambios = useCambios(filtros);
  const conFiltros = Boolean(filtros.entidad || filtros.accion || filtros.desde || filtros.hasta);
  const invalido = cambios.error instanceof ErrorApi && cambios.error.status === 400;

  const filtrar = (parcial: Partial<Omit<Filtros, "pagina">>) =>
    setFiltros((actuales) => ({ ...actuales, ...parcial, pagina: 1 }));

  return (
    <div className="flex flex-col gap-6">
      <FiltrosCambios
        filtros={filtros}
        errores={cambios.error instanceof ErrorApi ? cambios.error.errores : undefined}
        onCambiar={filtrar}
      />

      {cambios.isPending ? (
        <div role="status" aria-label="Cargando cambios" className="flex justify-center py-12 text-texto-suave">
          <Spinner className="size-6" />
        </div>
      ) : cambios.isError ? (
        invalido ? (
          <EmptyState mensaje={cambios.error.message} />
        ) : (
          <ErrorCarga
            mensaje={cambios.error.message}
            reintentando={cambios.isFetching}
            onReintentar={() => cambios.refetch()}
          />
        )
      ) : cambios.data.items.length === 0 ? (
        <EmptyState mensaje={conFiltros ? "No hay cambios con estos filtros" : "No hay cambios registrados"} />
      ) : (
        <div
          aria-busy={cambios.isPlaceholderData}
          className={cn("flex flex-col gap-4 transition-opacity", cambios.isPlaceholderData && "opacity-60")}
        >
          <TablaCambios items={cambios.data.items} />
          <Paginacion
            pagina={cambios.data.pagina}
            tamano={cambios.data.tamano}
            total={cambios.data.total}
            cargando={cambios.isPlaceholderData}
            onCambiar={(pagina) => setFiltros((actuales) => ({ ...actuales, pagina }))}
          />
        </div>
      )}
    </div>
  );
}
