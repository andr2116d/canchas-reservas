"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProveedorToast } from "@/components/ui/toast";
import { esRutaPrivada } from "@/features/auth/roles";
import { ErrorApi } from "@/lib/api";

type MetaSesion = { manejaSesion?: boolean };

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: MetaSesion;
    mutationMeta: MetaSesion;
  }
}

function crearCliente(irAlLogin: () => void) {
  let redirigiendo = false;
  const alFallar = (error: Error, meta: MetaSesion | undefined) => {
    const sinSesion = error instanceof ErrorApi && error.status === 401;
    if (!sinSesion || meta?.manejaSesion || redirigiendo || !esRutaPrivada(window.location.pathname)) return;
    redirigiendo = true;
    irAlLogin();
    cliente.clear();
  };
  const alResponder = () => {
    redirigiendo = false;
  };
  const cliente: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: (error, query) => alFallar(error, query.meta), onSuccess: alResponder }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _resultado, mutation) => alFallar(error, mutation.meta),
      onSuccess: alResponder,
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (intentos, error) =>
          !(error instanceof ErrorApi && error.status < 500) && intentos < 2,
      },
    },
  });
  return cliente;
}

export function Proveedores({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [cliente] = useState(() => crearCliente(() => router.replace("/login")));
  return (
    <QueryClientProvider client={cliente}>
      <ProveedorToast>{children}</ProveedorToast>
    </QueryClientProvider>
  );
}
