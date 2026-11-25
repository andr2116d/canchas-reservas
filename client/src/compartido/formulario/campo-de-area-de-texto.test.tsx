import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { CampoDeAreaDeTexto } from "./campo-de-area-de-texto";

function ConCampo({ error }: { error?: string }) {
  const formulario = useForm({ defaultValues: { detalle: "" } });
  if (error && !formulario.formState.errors.detalle) formulario.setError("detalle", { message: error });
  return (
    <FormProvider {...formulario}>
      <CampoDeAreaDeTexto nombre="detalle" etiqueta="Detalle" maximo={20} ayuda="Qué pasó y cuándo." />
    </FormProvider>
  );
}

describe("CampoDeAreaDeTexto", () => {
  it("cuenta los caracteres y no deja pasar del máximo", async () => {
    const persona = userEvent.setup();
    render(<ConCampo />);

    await persona.type(screen.getByLabelText(/^Detalle/), "a".repeat(25));

    expect(screen.getByLabelText(/^Detalle/)).toHaveValue("a".repeat(20));
    expect(screen.getByText("20 de 20")).toBeInTheDocument();
  });

  it("asocia la ayuda y anuncia el error", () => {
    render(<ConCampo error="Ingresa el detalle." />);

    const campo = screen.getByLabelText(/^Detalle/);
    expect(campo).toHaveAccessibleDescription(/Qué pasó y cuándo\..*Ingresa el detalle\./);
    expect(campo).toHaveAttribute("aria-invalid", "true");
  });
});
