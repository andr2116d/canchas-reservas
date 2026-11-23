"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import { useAjustarDocumentoAlCambiarTipo } from "@/compartido/formulario/use-ajustar-documento";
import { type DatosDeAlta, esquemaDeAlta } from "../esquemas/recepcionista.schema";
import { crearRecepcionista } from "../servicios/recepcionistas.api";
import { useReactivacionDesdeElAlta } from "./use-reactivacion-desde-el-alta";

const DATOS_INICIALES: DatosDeAlta = {
  nombres: "",
  apellidos: "",
  fechaNacimiento: "",
  tipoDocumento: "DNI",
  numeroDocumento: "",
  celular: "",
  usuarioDeCorreo: "",
  contrasena: "",
};

interface CuentaCreada {
  id: number;
  usuarioDeCorreo: string;
  contrasena: string;
}

/**
 * Alta de una recepcionista. Si sus datos coinciden con una cuenta
 * desactivada, ofrece reactivarla en vez de crear otra.
 */
export function useAltaDeRecepcionista() {
  const [creada, setCreada] = useState<CuentaCreada>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosDeAlta>({
    resolver: zodResolver(esquemaDeAlta),
    mode: "onChange",
    defaultValues: DATOS_INICIALES,
  });
  useAjustarDocumentoAlCambiarTipo(formulario);
  const reactivacion = useReactivacionDesdeElAlta(formulario, setErrorGeneral);

  const enviar = formulario.handleSubmit(async (datos) => {
    setErrorGeneral(undefined);
    reactivacion.cancelar();
    const resultado = await crearRecepcionista(datos);
    if (resultado.tipo === "creada") {
      const usuarioDeCorreo = datos.usuarioDeCorreo.trim().toLowerCase();
      setCreada({ id: resultado.id, usuarioDeCorreo, contrasena: datos.contrasena });
    } else if (resultado.tipo === "reactivable") {
      reactivacion.ofrecer({ id: resultado.id, nombres: resultado.nombres });
    } else if (resultado.tipo === "datos-rechazados") {
      marcarErroresDelServer(formulario, resultado.errores);
    } else {
      setErrorGeneral(resultado.mensaje);
    }
  });

  function crearOtra() {
    formulario.reset(DATOS_INICIALES);
    setCreada(undefined);
  }

  return { formulario, enviar, errorGeneral, creada, crearOtra, reactivacion };
}
