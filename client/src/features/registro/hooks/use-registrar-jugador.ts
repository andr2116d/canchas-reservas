"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { atenderRechazo } from "@/compartido/formulario/marcar-errores-del-server";
import { useAjustarDocumentoAlCambiarTipo } from "@/compartido/formulario/use-ajustar-documento";
import { type DatosRegistro, esquemaRegistro } from "../esquemas/registro.schema";
import { registrarJugador } from "../servicios/registro.api";

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
  versionLegalAceptada: "",
};

/**
 * Estado y envío del formulario de registro: valida cada campo mientras se
 * escribe y, al registrarse, lleva al inicio del jugador.
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
      router.replace("/inicio");
    } else {
      setErrorGeneral(atenderRechazo(formulario, resultado));
    }
  });

  return { formulario, enviarRegistro, errorGeneral };
}
