"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import type { Cuenta } from "@/compartido/cuenta/cuenta.servidor";
import { atenderRechazo } from "@/compartido/formulario/marcar-errores-del-server";
import type { TipoDocumento } from "@/compartido/formulario/reglas-de-datos-personales";
import { useAjustarDocumentoAlCambiarTipo } from "@/compartido/formulario/use-ajustar-documento";
import { type DatosPropios, esquemaDeDatosCompletos, esquemaDeDatosConfirmados } from "../esquemas/datos-propios.schema";
import { completarMisDatos } from "../servicios/cuenta.api";

/**
 * Primer ingreso del personal: con documento ya cargado solo se confirma o corrige
 * lo demás; sin documento, se completa todo. Al guardar sigue al paso siguiente.
 */
export function useDatosPropios(cuenta: Cuenta, siguiente: string) {
  const router = useRouter();
  const documentoFijo = Boolean(cuenta.numeroDocumento);
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosPropios>({
    resolver: zodResolver(documentoFijo ? esquemaDeDatosConfirmados : esquemaDeDatosCompletos),
    mode: "onTouched",
    defaultValues: {
      nombres: cuenta.nombres,
      apellidos: cuenta.apellidos,
      fechaNacimiento: cuenta.fechaNacimiento ?? "",
      celular: cuenta.celular ?? "",
      ...(!documentoFijo && { tipoDocumento: "DNI", numeroDocumento: "" }),
    },
  });
  // Sin documento que escribir, el ajuste no hace nada: no hay tipo que cambie.
  useAjustarDocumentoAlCambiarTipo(formulario as unknown as UseFormReturn<DatosPropios & { tipoDocumento: TipoDocumento; numeroDocumento: string }>);

  const enviar = formulario.handleSubmit(async (datos) => {
    setErrorGeneral(undefined);
    const { tipoDocumento, numeroDocumento, ...personales } = datos;
    const resultado = await completarMisDatos(documentoFijo ? personales : { ...personales, tipoDocumento, numeroDocumento });
    if (resultado.tipo === "hecho") router.replace(siguiente);
    else setErrorGeneral(atenderRechazo(formulario, resultado));
  });

  return { formulario, enviar, errorGeneral, documentoFijo };
}
