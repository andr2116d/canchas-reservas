"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/layout/logo";
import { Button, Card, Input, Select } from "@/components/ui";
import { aplicarErroresServidor } from "@/lib/errores-formulario";
import { useRegistro } from "../hooks";
import type { DatosRegistro } from "../api";
import { esquemaRegistro, type DatosValidados, type ValoresRegistro } from "../schemas";

const CAMPOS_SERVIDOR = [
  "nombres",
  "apellidos",
  "tipoDocumento",
  "numeroDocumento",
  "correo",
  "telefono",
  "contrasena",
] as const;

function quitarConfirmacion(datos: DatosValidados): DatosRegistro {
  return {
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    tipoDocumento: datos.tipoDocumento,
    numeroDocumento: datos.numeroDocumento,
    correo: datos.correo,
    telefono: datos.telefono,
    contrasena: datos.contrasena,
  };
}

export function FormularioRegistro() {
  const { mutateAsync, isPending } = useRegistro();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ValoresRegistro, unknown, DatosValidados>({
    resolver: zodResolver(esquemaRegistro),
    mode: "onBlur",
    defaultValues: {
      nombres: "",
      apellidos: "",
      tipoDocumento: "",
      numeroDocumento: "",
      correo: "",
      telefono: "",
      contrasena: "",
      confirmacion: "",
    },
  });

  const enviar = handleSubmit(async (datos) => {
    try {
      await mutateAsync(quitarConfirmacion(datos));
    } catch (error) {
      aplicarErroresServidor(error, setError, [...CAMPOS_SERVIDOR]);
    }
  });

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <Logo className="text-[28px] leading-7 text-noche-900" />
      <Card className="flex w-full max-w-md flex-col gap-6">
        <h1 className="font-display text-[32px] leading-9 font-bold">Crea tu cuenta</h1>
        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          {errors.root?.servidor?.message && (
            <p role="alert" className="rounded-lg bg-error-fondo px-3 py-2 text-sm text-error">
              {errors.root.servidor.message}
            </p>
          )}
          <Input etiqueta="Nombres" autoComplete="off" error={errors.nombres?.message} {...register("nombres")} />
          <Input etiqueta="Apellidos" autoComplete="off" error={errors.apellidos?.message} {...register("apellidos")} />
          <Select etiqueta="Tipo de documento" error={errors.tipoDocumento?.message} {...register("tipoDocumento")}>
            <option value="">Elige el tipo de documento</option>
            <option value="DNI">DNI</option>
            <option value="CE">CE</option>
          </Select>
          <Input
            etiqueta="Número de documento"
            autoComplete="off"
            error={errors.numeroDocumento?.message}
            {...register("numeroDocumento")}
          />
          <Input
            etiqueta="Correo"
            type="email"
            autoComplete="email"
            error={errors.correo?.message}
            {...register("correo")}
          />
          <Input
            etiqueta="Celular"
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            error={errors.telefono?.message}
            {...register("telefono")}
          />
          <Input
            etiqueta="Contraseña"
            type="password"
            autoComplete="new-password"
            ayuda="Mínimo 8 caracteres"
            error={errors.contrasena?.message}
            {...register("contrasena")}
          />
          <Input
            etiqueta="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            error={errors.confirmacion?.message}
            {...register("confirmacion")}
          />
          <Button type="submit" cargando={isPending} className="mt-2">
            Crear cuenta
          </Button>
        </form>
        <p className="text-center text-sm text-texto-suave">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-cesped-600 hover:text-cesped-700">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </main>
  );
}