"use client";

import { useRouter } from "next/navigation";
import { useAvisar } from "@/compartido/ui/avisos-flotantes";
import { TARJETA } from "@/compartido/ui/estilos";
import { SIN_DATOS } from "../hooks/use-formulario-de-adicional";
import { registrarAdicional } from "../servicios/adicionales.api";
import { FormularioDeAdicional } from "./formulario-de-adicional";

interface AltaDeAdicionalProps {
  /** Nombre que llega de una idea del catálogo vacío. */
  nombreSugerido?: string;
  alCrear: (id: number) => void;
}

/** Tarjeta para agregar un adicional al catálogo; queda vacía para agregar otro. */
export function AltaDeAdicional({ nombreSugerido, alCrear }: AltaDeAdicionalProps) {
  const router = useRouter();
  const avisar = useAvisar();
  return (
    <section aria-labelledby="titulo-del-alta" className={`${TARJETA} flex flex-col gap-4`}>
      <h2 id="titulo-del-alta" className="font-titular text-2xl leading-none font-black text-tinta">Agregar adicional</h2>
      <FormularioDeAdicional
        id="alta"
        nombre="Agregar adicional"
        inicial={{ ...SIN_DATOS, nombre: nombreSugerido ?? "" }}
        enviar={registrarAdicional}
        alGuardar={(adicional) => {
          avisar(`${adicional.nombre} se agregó al catálogo.`);
          alCrear(adicional.id);
          router.refresh();
        }}
        boton={{ texto: "Agregar al catálogo", enviando: "Agregando…" }}
        ayudaDelPrecio="Lo que se cobra por cada unidad que se pierda o se rompa."
        limpiarAlGuardar
        enfocarPrecio={Boolean(nombreSugerido)}
      />
    </section>
  );
}
