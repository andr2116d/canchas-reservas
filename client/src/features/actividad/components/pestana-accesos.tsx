"use client";

import { useCallback, useState } from "react";
import { EmptyState, Spinner } from "@/components/ui";
import { ErrorApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { FiltrosAccesos as Filtros } from "../api";
import { useAccesos } from "../hooks";
import { ErrorCarga } from "./error-carga";
import { FiltrosAccesos } from "./filtros-accesos";
import { Paginacion } from "./paginacion";
import { TablaAccesos } from "./tabla-accesos";

export function PestanaAccesos() {
  const [filtros, setFiltros] = useState<Filtros>({ pagina: 1 });
  const accesos = useAccesos(filtros);
  const conFiltros = Boolean(filtros.exito !== undefined || filtros.correo || filtros.desde || filtros.hasta);
  const invalido = accesos.error instanceof ErrorApi && accesos.error.status === 400;

  const filtrar = useCallback(
    (parcial: Partial<Omit<Filtros, "pagina">>) => setFiltros((actuales) => ({ ...actuales, ...parcial, pagina: 1 })),
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <FiltrosAccesos
        filtros={filtros}
        errores={accesos.error instanceof ErrorApi ? accesos.error.errores : undefined}
        onCambiar={filtrar}
      />

      {accesos.isPending ? (
        <div role="status" aria-label="Cargando accesos" className="flex justify-center py-12 text-texto-suave">
          <Spinner className="size-6" />
        </div>
      ) : accesos.isError ? (
        invalido ? (
          <EmptyState mensaje={accesos.error.message} />
        ) : (
          <ErrorCarga
            mensaje={accesos.error.message}
            reintentando={accesos.isFetching}
            onReintentar={() => accesos.refetch()}
          />
        )
      ) : accesos.data.items.length === 0 ? (
        <EmptyState mensaje={conFiltros ? "No hay accesos con estos filtros" : "No hay accesos registrados"} />
      ) : (
        <div
          aria-busy={accesos.isPlaceholderData}
          className={cn("flex flex-col gap-4 transition-opacity", accesos.isPlaceholderData && "opacity-60")}
        >
          <TablaAccesos items={accesos.data.items} />
          <Paginacion
            pagina={accesos.data.pagina}
            tamano={accesos.data.tamano}
            total={accesos.data.total}
            cargando={accesos.isPlaceholderData}
            onCambiar={(pagina) => setFiltros((actuales) => ({ ...actuales, pagina }))}
          />
        </div>
      )}
    </div>
  );
}
