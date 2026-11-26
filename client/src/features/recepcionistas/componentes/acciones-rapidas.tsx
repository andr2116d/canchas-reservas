"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { TarjetaFlotante } from "@/compartido/ui/tarjeta-flotante";
import type { FichaDeRecepcionista } from "../servicios/ficha-de-recepcionista";
import { reactivarRecepcionista, restablecerContrasena } from "../servicios/recepcionistas.api";
import { ConfirmacionDeDesactivacion } from "./confirmacion-de-desactivacion";
import { FormularioDeContrasenaTemporal } from "./formulario-de-contrasena-temporal";

type Accion = "restablecer" | "desactivar" | "reactivar";

const TITULOS: Record<Accion, string> = {
  restablecer: "Restablecer contraseña",
  desactivar: "Desactivar cuenta",
  reactivar: "Reactivar cuenta",
};

/** Acciones sobre el acceso de una recepcionista sin salir del listado, en una tarjeta flotante. */
export function AccionesRapidas({ ficha }: { ficha: FichaDeRecepcionista }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState<Accion>();
  // Refresca al cerrar: así la fila no desaparece antes de copiar los datos para entregar.
  const cambio = useRef(false);
  const nombre = `${ficha.nombres} ${ficha.apellidos}`;
  const activa = ficha.estado === "ACTIVO";

  function cerrar() {
    setAbierta(undefined);
    if (cambio.current) router.refresh();
    cambio.current = false;
  }

  const formulario = (accion: "restablecer" | "reactivar") => (
    <FormularioDeContrasenaTemporal
      correo={ficha.correo}
      textoDelBoton={TITULOS[accion]}
      textoAlEnviar={accion === "reactivar" ? "Reactivando…" : "Restableciendo…"}
      ejecutar={(contrasena) => (accion === "reactivar" ? reactivarRecepcionista : restablecerContrasena)(ficha.id, contrasena)}
      alTerminar={() => (cambio.current = true)}
    />
  );

  return (
    <div className="flex flex-wrap gap-2">
      {activa ? (
        <>
          <button type="button" onClick={() => setAbierta("restablecer")} aria-label={`Restablecer la contraseña de ${nombre}`} className={BOTON_SECUNDARIO}>
            Restablecer contraseña
          </button>
          <button type="button" onClick={() => setAbierta("desactivar")} aria-label={`Desactivar a ${nombre}`} className={`${BOTON_SECUNDARIO} text-error`}>
            Desactivar
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setAbierta("reactivar")} aria-label={`Reactivar a ${nombre}`} className={BOTON_SECUNDARIO}>
          Reactivar
        </button>
      )}
      <TarjetaFlotante titulo={abierta ? TITULOS[abierta] : ""} abierta={Boolean(abierta)} alCerrar={cerrar}>
        {abierta === "desactivar" ? (
          <ConfirmacionDeDesactivacion id={ficha.id} nombres={ficha.nombres} alCancelar={cerrar} />
        ) : (
          abierta && formulario(abierta)
        )}
      </TarjetaFlotante>
    </div>
  );
}
