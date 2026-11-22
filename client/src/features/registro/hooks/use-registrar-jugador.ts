"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { type DatosRegistro, esquemaRegistro } from "../esquemas/registro.schema";
import { destinoTrasRegistro } from "../servicios/destino-tras-registro";
import { type ErroresDeRegistro, registrarJugador } from "../servicios/registro.api";

const DATOS_INICIALES: DatosRegistro = {
  nombres: "",
  apellidos: "",
  fechaNacimiento: "",
  tipoDocumento: "DNI",
  numeroDocumento: "",
  celular: "",
  correo: "",
  contrasena: "",
  dorsal: "",
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

/**
 * Al cambiar el tipo de documento: si pasa a DNI vacía el número (el DNI no
 * admite letras); si pasa a carné, revalida lo escrito con sus reglas.
 */
function useAjustarDocumentoAlCambiarTipo(formulario: UseFormReturn<DatosRegistro>) {
  const { control, getFieldState, setValue, clearErrors, trigger } = formulario;
  const tipoDocumento = useWatch({ control, name: "tipoDocumento" });
  const tipoAnterior = useRef(tipoDocumento);
  useEffect(() => {
    if (tipoAnterior.current === tipoDocumento) return;
    tipoAnterior.current = tipoDocumento;
    if (tipoDocumento === "DNI") {
      setValue("numeroDocumento", "");
      clearErrors("numeroDocumento");
    } else if (getFieldState("numeroDocumento").isDirty) {
      void trigger("numeroDocumento");
    }
  }, [tipoDocumento, getFieldState, setValue, clearErrors, trigger]);
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
  useAjustarDocumentoAlCambiarTipo(formulario);

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
