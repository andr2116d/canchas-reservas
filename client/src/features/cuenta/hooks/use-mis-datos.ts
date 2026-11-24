"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Cuenta, DatoEditable } from "@/compartido/cuenta/cuenta.servidor";
import { atenderRechazo } from "@/compartido/formulario/marcar-errores-del-server";
import { reglaDeUsuarioDeCorreo } from "@/compartido/formulario/regla-de-usuario-de-correo";
import {
  campoCon,
  reglaDeCorreo,
  reglaDeDorsal,
  reglasDeDatosPersonales,
  type Regla,
} from "@/compartido/formulario/reglas-de-datos-personales";
import { actualizarMiCuenta } from "../servicios/cuenta.api";

const PROPIAS = reglasDeDatosPersonales("propia");
const REGLAS: Record<DatoEditable | "usuarioDeCorreo", Regla> = {
  nombres: PROPIAS.nombres,
  apellidos: PROPIAS.apellidos,
  fechaNacimiento: PROPIAS.fechaNacimiento,
  correo: reglaDeCorreo,
  usuarioDeCorreo: reglaDeUsuarioDeCorreo("Escribe tu correo de La Previa."),
  celular: PROPIAS.celular,
  dorsal: reglaDeDorsal,
};

type Campo = DatoEditable | "usuarioDeCorreo";

function valoresActuales(cuenta: Cuenta): Record<Campo, string> {
  return {
    nombres: cuenta.nombres,
    apellidos: cuenta.apellidos,
    fechaNacimiento: cuenta.fechaNacimiento ?? "",
    correo: cuenta.correo,
    usuarioDeCorreo: cuenta.correo.split("@")[0],
    celular: cuenta.celular ?? "",
    dorsal: cuenta.dorsal?.toString() ?? "",
  };
}

/**
 * Edita lo que el rol permite cambiar de su propia cuenta. El administrador escribe solo lo
 * que va antes de la @ de su correo institucional; se envía completo.
 */
export function useMisDatos(cuenta: Cuenta) {
  const router = useRouter();
  const [guardado, setGuardado] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const institucional = cuenta.rol !== "JUGADOR";
  const dominio = cuenta.correo.split("@")[1];
  const campos: Campo[] = cuenta.editables.map((dato) => (dato === "correo" && institucional ? "usuarioDeCorreo" : dato));
  const actuales = valoresActuales(cuenta);
  const formulario = useForm<Partial<Record<Campo, string>>>({
    resolver: zodResolver(z.object(Object.fromEntries(campos.map((campo) => [campo, campoCon(REGLAS[campo])])))),
    mode: "onTouched",
    defaultValues: Object.fromEntries(campos.map((campo) => [campo, actuales[campo]])),
  });

  const enviar = formulario.handleSubmit(async ({ usuarioDeCorreo, ...cambios }) => {
    setGuardado(false);
    setErrorGeneral(undefined);
    const resultado = await actualizarMiCuenta(
      usuarioDeCorreo === undefined ? cambios : { ...cambios, correo: `${usuarioDeCorreo.trim()}@${dominio}` },
    );
    if (resultado.tipo === "hecho") {
      setGuardado(true);
      router.refresh();
    } else if (resultado.tipo === "datos-rechazados" && institucional && resultado.errores.correo) {
      const { correo, ...otros } = resultado.errores;
      setErrorGeneral(atenderRechazo(formulario, { tipo: "datos-rechazados", errores: { ...otros, usuarioDeCorreo: correo } }));
    } else {
      setErrorGeneral(atenderRechazo(formulario, resultado));
    }
  });

  return { formulario, enviar, guardado, errorGeneral, dominio };
}
