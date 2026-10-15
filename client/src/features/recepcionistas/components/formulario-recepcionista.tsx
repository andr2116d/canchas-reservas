"use client";

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button, Input, Modal, Select } from "@/components/ui";
import type { DatosCrearRecepcionista, DatosEditarRecepcionista, Recepcionista } from "../api";
import {
  esquemaCrearRecepcionista,
  esquemaEditarRecepcionista,
  type ValoresCrearRecepcionista,
  type ValoresEditarRecepcionista,
} from "../schemas";
import { aplicarErroresServidor } from "@/lib/errores-formulario";
import { MensajeServidor } from "./errores-servidor";

const CAMPOS_CREAR = [
  "nombres",
  "apellidos",
  "tipoDocumento",
  "numeroDocumento",
  "correo",
  "telefono",
  "contrasena",
] as const;
const CAMPOS_EDITAR = ["nombres", "apellidos", "telefono", "correo"] as const;

function Acciones({ formId, enviando, onCerrar, texto }: { formId: string; enviando: boolean; onCerrar: () => void; texto: string }) {
  return (
    <>
      <Button type="button" variante="secundario" onClick={onCerrar}>
        Cancelar
      </Button>
      <Button type="submit" form={formId} cargando={enviando}>
        {texto}
      </Button>
    </>
  );
}

type PropsCrear = {
  abierto: boolean;
  onCerrar: () => void;
  onEnviar: (datos: DatosCrearRecepcionista) => Promise<unknown>;
};

export function FormularioCrearRecepcionista({ abierto, onCerrar, onEnviar }: PropsCrear) {
  const formId = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ValoresCrearRecepcionista, unknown, z.output<typeof esquemaCrearRecepcionista>>({
    resolver: zodResolver(esquemaCrearRecepcionista),
    defaultValues: {
      nombres: "",
      apellidos: "",
      tipoDocumento: "DNI",
      numeroDocumento: "",
      correo: "",
      telefono: "",
      contrasena: "",
    },
  });

  const enviar = handleSubmit(async (datos) => {
    try {
      await onEnviar(datos);
    } catch (error) {
      aplicarErroresServidor(error, setError, [...CAMPOS_CREAR]);
    }
  });

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nuevo recepcionista"
      acciones={<Acciones formId={formId} enviando={isSubmitting} onCerrar={onCerrar} texto="Crear recepcionista" />}
    >
      <form id={formId} noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <MensajeServidor mensaje={errors.root?.servidor?.message} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input etiqueta="Nombres" autoComplete="off" error={errors.nombres?.message} {...register("nombres")} />
          <Input etiqueta="Apellidos" autoComplete="off" error={errors.apellidos?.message} {...register("apellidos")} />
          <Select etiqueta="Tipo de documento" error={errors.tipoDocumento?.message} {...register("tipoDocumento")}>
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
            autoComplete="off"
            error={errors.correo?.message}
            {...register("correo")}
          />
          <Input
            etiqueta="Teléfono"
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            error={errors.telefono?.message}
            {...register("telefono")}
          />
        </div>
        <Input
          etiqueta="Contraseña inicial"
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

type PropsEditar = {
  recepcionista: Recepcionista;
  abierto: boolean;
  onCerrar: () => void;
  onEnviar: (datos: DatosEditarRecepcionista) => Promise<unknown>;
};

export function FormularioEditarRecepcionista({ recepcionista, abierto, onCerrar, onEnviar }: PropsEditar) {
  const formId = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ValoresEditarRecepcionista, unknown, z.output<typeof esquemaEditarRecepcionista>>({
    resolver: zodResolver(esquemaEditarRecepcionista),
    defaultValues: {
      nombres: recepcionista.nombres,
      apellidos: recepcionista.apellidos ?? "",
      telefono: recepcionista.telefono,
      correo: recepcionista.correo,
    },
  });

  const enviar = handleSubmit(async (datos) => {
    try {
      await onEnviar(datos);
    } catch (error) {
      aplicarErroresServidor(error, setError, [...CAMPOS_EDITAR]);
    }
  });

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Editar recepcionista"
      acciones={<Acciones formId={formId} enviando={isSubmitting} onCerrar={onCerrar} texto="Guardar cambios" />}
    >
      <form id={formId} noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <MensajeServidor mensaje={errors.root?.servidor?.message} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input etiqueta="Nombres" autoComplete="off" error={errors.nombres?.message} {...register("nombres")} />
          <Input etiqueta="Apellidos" autoComplete="off" error={errors.apellidos?.message} {...register("apellidos")} />
          <Select etiqueta="Tipo de documento" value={recepcionista.tipoDocumento} disabled>
            <option value={recepcionista.tipoDocumento}>{recepcionista.tipoDocumento}</option>
          </Select>
          <Input etiqueta="Número de documento" value={recepcionista.numeroDocumento} disabled readOnly />
          <Input
            etiqueta="Correo"
            type="email"
            autoComplete="off"
            error={errors.correo?.message}
            {...register("correo")}
          />
          <Input
            etiqueta="Teléfono"
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            error={errors.telefono?.message}
            {...register("telefono")}
          />
        </div>
      </form>
    </Modal>
  );
}
