"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAvisar } from "@/compartido/ui/avisos-flotantes";
import { TarjetaFlotante } from "@/compartido/ui/tarjeta-flotante";
import { editarAdicional } from "../servicios/adicionales.api";
import { type Adicional, enSoles } from "../servicios/adicionales";
import { AccionesDeAdicional } from "./acciones-de-adicional";
import { FormularioDeAdicional } from "./formulario-de-adicional";

const igual = (a: Adicional, b: Adicional) => a.nombre === b.nombre && a.descripcion === b.descripcion && a.precio === b.precio;

/** Edición en una tarjeta flotante, para no mover la lista. */
function EdicionDeAdicional({ adicional, abierta, alCerrar }: { adicional: Adicional; abierta: boolean; alCerrar: () => void }) {
  const router = useRouter();
  const avisar = useAvisar();
  return (
    <TarjetaFlotante titulo={`Editar ${adicional.nombre}`} abierta={abierta} alCerrar={alCerrar}>
      <FormularioDeAdicional
        id={`edicion-${adicional.id}`}
        nombre={`Editar ${adicional.nombre}`}
        inicial={{ nombre: adicional.nombre, descripcion: adicional.descripcion ?? "", precio: adicional.precio }}
        enviar={(datos) => editarAdicional(adicional.id, datos)}
        alGuardar={(guardado) => {
          avisar(igual(guardado, adicional) ? `No había cambios: ${guardado.nombre} sigue igual.` : `Se guardaron los cambios de ${guardado.nombre}.`);
          router.refresh();
          alCerrar();
        }}
        boton={{ texto: "Guardar cambios", enviando: "Guardando…" }}
        ayudaDelPrecio="Un precio nuevo rige para los cobros que vengan; lo ya cobrado no cambia."
      />
    </TarjetaFlotante>
  );
}

interface FilaDeAdicionalProps {
  adicional: Adicional;
  /** Recién agregado: entra con una animación. */
  nuevo?: boolean;
}

/** Un adicional del catálogo: nombre, descripción, precio por unidad, estado y acciones. */
export function FilaDeAdicional({ adicional, nuevo = false }: FilaDeAdicionalProps) {
  const [editando, setEditando] = useState(false);
  const desactivado = adicional.estado === "DESACTIVADO";
  return (
    <li className={`fila-de-adicional ${nuevo ? "fila-de-adicional--nueva" : ""}`} data-desactivado={desactivado || undefined}>
      <div className="fila-de-adicional__dato min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 font-bold text-tinta">
          {adicional.nombre}
          {desactivado && <span className="rounded-full bg-tiza px-2 py-0.5 text-xs font-bold text-grava">Desactivado</span>}
        </p>
        {adicional.descripcion && <p className="truncate text-sm text-grava">{adicional.descripcion}</p>}
      </div>
      <p className="fila-de-adicional__dato row-span-2 text-right">
        <span className="block font-titular text-xl leading-none font-black text-tinta tabular-nums">{enSoles(adicional.precio)}</span>
        <span className="text-xs text-grava">por unidad</span>
      </p>
      <AccionesDeAdicional adicional={adicional} alEditar={() => setEditando(true)} />
      <EdicionDeAdicional adicional={adicional} abierta={editando} alCerrar={() => setEditando(false)} />
    </li>
  );
}
