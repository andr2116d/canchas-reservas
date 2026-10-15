"use client";

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Modal } from "@/components/ui";
import { nombreCompleto, type Recepcionista } from "../api";
import { esquemaRestablecerContrasena, type ValoresRestablecerContrasena } from "../schemas";
import { aplicarErroresServidor } from "@/lib/errores-formulario";
import { MensajeServidor } from "./errores-servidor";

type Props = {
  recepcionista: Recepcionista;
  abierto: boolean;
  onCerrar: () => void;
  onEnviar: (contrasena: string) => Promise<unknown>;
};

export function RestablecerContrasena({ recepcionista, abierto, onCerrar, onEnviar }: Props) {
  const formId = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ValoresRestablecerContrasena>({
    resolver: zodResolver(esquemaRestablecerContrasena),
    defaultValues: { contrasena: "" },
  });

  const enviar = handleSubmit(async ({ contrasena }) => {
    try {
      await onEnviar(contrasena);
    } catch (error) {
      aplicarErroresServidor(error, setError, ["contrasena"]);
    }
  });

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Restablecer contraseña"
      acciones={
        <>
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} cargando={isSubmitting}>
            Restablecer
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <p className="text-texto-suave">
          Escribe la nueva contraseña de{" "}
          <span className="font-medium text-texto">
            {nombreCompleto(recepcionista)}
          </span>
          . La usará en su próximo inicio de sesión.
        </p>
        <MensajeServidor mensaje={errors.root?.servidor?.message} />
        <Input
          etiqueta="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          ayuda="Mínimo 8 caracteres"
          error={errors.contrasena?.message}
          {...register("contrasena")}
        />
      </form>
    </Modal>
  );
}
