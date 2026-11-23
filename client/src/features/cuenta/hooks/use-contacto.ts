"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Cuenta, DatoEditable } from "@/compartido/cuenta/cuenta.servidor";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import {
  campoCon,
  reglaDeCorreo,
  reglaDeDorsal,
  reglasDeDatosPersonales,
  type Regla,
} from "@/compartido/formulario/reglas-de-datos-personales";
import { actualizarMiCuenta } from "../servicios/cuenta.api";

const REGLAS: Record<DatoEditable, Regla> = {
  correo: reglaDeCorreo,
  celular: reglasDeDatosPersonales("propia").celular,
  dorsal: reglaDeDorsal,
};

type DatosDeContacto = Partial<Record<DatoEditable, string>>;

function valoresActuales(cuenta: Cuenta): Record<DatoEditable, string> {
  return { correo: cuenta.correo, celular: cuenta.celular ?? "", dorsal: cuenta.dorsal?.toString() ?? "" };
}

/** Edita los datos de contacto que el rol permite cambiar y refresca la cuenta al guardar. */
export function useContacto(cuenta: Cuenta) {
  const router = useRouter();
  const [guardado, setGuardado] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const actuales = valoresActuales(cuenta);
  const formulario = useForm<DatosDeContacto>({
    resolver: zodResolver(z.object(Object.fromEntries(cuenta.editables.map((dato) => [dato, campoCon(REGLAS[dato])])))),
    mode: "onChange",
    defaultValues: Object.fromEntries(cuenta.editables.map((dato) => [dato, actuales[dato]])),
  });

  const enviar = formulario.handleSubmit(async (cambios) => {
    setGuardado(false);
    setErrorGeneral(undefined);
    const resultado = await actualizarMiCuenta(cambios);
    if (resultado.tipo === "hecho") {
      setGuardado(true);
      router.refresh();
    } else if (resultado.tipo === "datos-rechazados") {
      marcarErroresDelServer(formulario, resultado.errores);
    } else {
      setErrorGeneral(resultado.mensaje);
    }
  });

  return { formulario, enviar, guardado, errorGeneral };
}
