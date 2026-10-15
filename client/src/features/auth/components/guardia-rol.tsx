"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import { ErrorApi } from "@/lib/api";
import type { Rol } from "../api";
import { useSesion } from "../hooks";

export function GuardiaRol({ rol, children }: { rol: Rol; children: React.ReactNode }) {
  const router = useRouter();
  const sesion = useSesion();

  const sinSesion = sesion.error instanceof ErrorApi && sesion.error.status === 401;
  const otroRol = sesion.data !== undefined && sesion.data.rol !== rol;

  useEffect(() => {
    if (sinSesion) router.replace("/login");
    else if (otroRol) router.replace("/no-autorizado");
  }, [sinSesion, otroRol, router]);

  if (sesion.isError && !sinSesion) {
    return (
      <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-error">{sesion.error.message}</p>
        <Button variante="secundario" onClick={() => sesion.refetch()} cargando={sesion.isFetching}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!sesion.data || sinSesion || otroRol) {
    return (
      <div className="flex flex-1 items-center justify-center" role="status" aria-label="Cargando">
        <Spinner className="size-6 text-cesped-600" />
      </div>
    );
  }

  return <>{children}</>;
}
