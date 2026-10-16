"use client";

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alerta, Button, Input, Modal } from "@/components/ui";
import { aplicarErroresServidor } from "@/lib/errores-formulario";
import { conFiltro, decimal } from "@/lib/filtros-entrada";
import type { Adicional } from "../api";
import { type DatosAdicional, esquemaAdicional, type ValoresAdicional } from "../schemas";

const CAMPOS = ["nombre", "precio"] as const;

type Props = {
  adicional?: Adicional;
  abierto: boolean;
  onCerrar: () => void;
  onEnviar: (datos: DatosAdicional) => Promise<unknown>;
};

export function FormularioAdicional({ adicional, abierto, onCerrar, onEnviar }: Props) {
  const formId = useId();
  const editando = adicional !== undefined;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ValoresAdicional, unknown, DatosAdicional>({
    resolver: zodResolver(esquemaAdicional),
    defaultValues: {
      nombre: adicional?.nombre ?? "",
      precio: adicional ? adicional.precio.toFixed(2) : "",
    },
  });

  const enviar = handleSubmit(async (datos) => {
    try {
      await onEnviar(datos);
    } catch (error) {
      aplicarErroresServidor(error, setError, [...CAMPOS]);
    }
  });

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={editando ? "Editar adicional" : "Nuevo adicional"}
      acciones={
        <>
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} cargando={isSubmitting}>
            {editando ? "Guardar cambios" : "Crear adicional"}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <Alerta>{errors.root?.servidor?.message}</Alerta>
        <Input etiqueta="Nombre" autoComplete="off" error={errors.nombre?.message} {...register("nombre")} />
        <Input
          etiqueta="Precio unitario"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          ayuda="Hasta 2 decimales, con punto. Ejemplo: 15.50"
          error={errors.precio?.message}
          {...conFiltro(register("precio"), decimal)}
        />
      </form>
    </Modal>
  );
}