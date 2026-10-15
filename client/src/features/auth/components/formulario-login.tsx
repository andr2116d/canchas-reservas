"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/layout/logo";
import { Alerta, Button, Card, Input } from "@/components/ui";
import { aplicarErroresServidor } from "@/lib/errores-formulario";
import { useIniciarSesion, useSesion } from "../hooks";
import { RUTA_PANEL } from "../roles";
import { esquemaLogin, type ValoresLogin } from "../schemas";

function AvisoUrl() {
  const parametros = useSearchParams();
  if (parametros.get("motivo") === "inactividad") {
    return <Alerta tono="info">Tu sesión se cerró por inactividad</Alerta>;
  }
  if (parametros.get("registro") === "ok") {
    return <Alerta tono="exito">Tu cuenta fue creada. Inicia sesión.</Alerta>;
  }
  return null;
}

export function FormularioLogin() {
  const router = useRouter();
  const { data: sesion } = useSesion();
  const { mutate, reset: reiniciarEnvio, isPending, isSuccess } = useIniciarSesion();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ValoresLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { correo: "", contrasena: "" },
  });

  useEffect(() => {
    if (sesion) router.replace(RUTA_PANEL[sesion.rol]);
  }, [sesion, router]);

  useEffect(
    () => () => {
      reset();
      reiniciarEnvio();
    },
    [reset, reiniciarEnvio],
  );

  const enviar = handleSubmit((datos) =>
    mutate(datos, {
      onError: (error) => aplicarErroresServidor(error, setError, ["correo", "contrasena"]),
    }),
  );

  const mensajeServidor = errors.root?.servidor?.message;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <Logo className="text-[28px] leading-7 text-noche-900" />
      <Card className="flex w-full max-w-md flex-col gap-6">
        <h1 className="font-display text-[32px] leading-9 font-bold">Inicia sesión</h1>
        <Suspense>
          <AvisoUrl />
        </Suspense>
        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <Alerta>{mensajeServidor}</Alerta>
          <Input
            etiqueta="Correo"
            type="email"
            autoComplete="email"
            error={errors.correo?.message}
            {...register("correo")}
          />
          <Input
            etiqueta="Contraseña"
            type="password"
            autoComplete="current-password"
            error={errors.contrasena?.message}
            {...register("contrasena")}
          />
          <Button type="submit" cargando={isPending || isSuccess} className="mt-2">
            Ingresar
          </Button>
        </form>
        <p className="text-center text-sm text-texto-suave">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-cesped-600 hover:text-cesped-700">
            Crea tu cuenta
          </Link>
        </p>
      </Card>
    </main>
  );
}
