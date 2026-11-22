"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { type DatosRegistro, esquemaRegistro } from "../esquemas/registro.schema";
import { destinoTrasRegistro } from "../servicios/destino-tras-registro";
import { type ErroresDeRegistro, registrarJugador } from "../servicios/registro.api";

const DATOS_INICIALES: DatosRegistro = {
  nombres: "",
  apellidos: "",
  tipoDocumento: "DNI",
  numeroDocumento: "",
  celular: "",
  correo: "",
  contrasena: "",
};

/** Muestra junto a cada campo lo que respondió el server y enfoca el primero. */
function marcarErroresDelServer(
  formulario: UseFormReturn<DatosRegistro>,
  errores: ErroresDeRegistro,
) {
  const campos = Object.keys(errores) as (keyof DatosRegistro)[];
  for (const campo of campos) {
    formulario.setError(campo, { type: "server", message: errores[campo] });
  }
  if (campos[0]) formulario.setFocus(campos[0]);
}

/** Si cambia el tipo de documento, revalida el número con las reglas del nuevo tipo. */
function useRevalidarDocumento(formulario: UseFormReturn<DatosRegistro>) {
  const { control, getFieldState, trigger } = formulario;
  const tipoDocumento = useWatch({ control, name: "tipoDocumento" });
  useEffect(() => {
    if (getFieldState("numeroDocumento").isDirty) void trigger("numeroDocumento");
  }, [tipoDocumento, getFieldState, trigger]);
}

/**
 * Estado y envío del formulario de registro: valida cada campo mientras se
 * escribe y, al registrarse, lleva a la reserva pendiente o al inicio.
 */
export function useRegistrarJugador() {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosRegistro>({
    resolver: zodResolver(esquemaRegistro),
    mode: "onChange",
    defaultValues: DATOS_INICIALES,
  });
  useRevalidarDocumento(formulario);

  const enviarRegistro = formulario.handleSubmit(async (datos) => {
    setErrorGeneral(undefined);
    const resultado = await registrarJugador(datos);
    if (resultado.tipo === "registrado") {
      const siguiente = new URLSearchParams(window.location.search).get("siguiente");
      router.replace(destinoTrasRegistro(siguiente ?? undefined));
    } else if (resultado.tipo === "datos-rechazados") {
      marcarErroresDelServer(formulario, resultado.errores);
    } else {
      setErrorGeneral(resultado.mensaje);
    }
  });

  return { formulario, enviarRegistro, errorGeneral };
}
