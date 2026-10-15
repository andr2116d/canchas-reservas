"use client";

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alerta, Button, Input, Modal, Select, Switch } from "@/components/ui";
import { aplicarErroresServidor } from "@/lib/errores-formulario";
import { ETIQUETA_ESTADO, ETIQUETA_TAMANO, type Cancha, type DatosEditarCancha } from "../api";
import { esquemaCancha, type DatosCancha, type ValoresCancha } from "../schemas";

const CAMPOS = ["nombre", "tamano", "iluminacion", "estado"] as const;

type Props = {
  cancha?: Cancha;
  abierto: boolean;
  onCerrar: () => void;
  onEnviar: (datos: DatosEditarCancha) => Promise<unknown>;
};

export function FormularioCancha({ cancha, abierto, onCerrar, onEnviar }: Props) {
  const formId = useId();
  const editando = cancha !== undefined;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ValoresCancha, unknown, DatosCancha>({
    resolver: zodResolver(esquemaCancha),
    defaultValues: {
      nombre: cancha?.nombre ?? "",
      tamano: cancha?.tamano ?? "",
      iluminacion: cancha?.iluminacion ?? false,
      estado: cancha?.estado ?? "OPERATIVA",
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
      titulo={editando ? "Editar cancha" : "Nueva cancha"}
      acciones={
        <>
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} cargando={isSubmitting}>
            {editando ? "Guardar cambios" : "Crear cancha"}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <Alerta>{errors.root?.servidor?.message}</Alerta>
        <Input etiqueta="Nombre" autoComplete="off" error={errors.nombre?.message} {...register("nombre")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select etiqueta="Tamaño" error={errors.tamano?.message} {...register("tamano")}>
            <option value="" disabled>
              Elige el tamaño
            </option>
            {Object.entries(ETIQUETA_TAMANO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </Select>
          {editando ? (
            <Select etiqueta="Estado" error={errors.estado?.message} {...register("estado")}>
              {Object.entries(ETIQUETA_ESTADO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Select>
          ) : (
            <Select etiqueta="Estado" value="OPERATIVA" disabled ayuda="Toda cancha nueva empieza operativa">
              <option value="OPERATIVA">{ETIQUETA_ESTADO.OPERATIVA}</option>
            </Select>
          )}
        </div>
        <Switch etiqueta="Tiene iluminación" error={errors.iluminacion?.message} {...register("iluminacion")} />
      </form>
    </Modal>
  );
}
