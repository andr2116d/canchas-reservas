import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextoDeEnvio } from "./texto-de-envio";

describe("TextoDeEnvio", () => {
  it("muestra la acción mientras no se envía", () => {
    const { container } = render(<button type="button"><TextoDeEnvio enviando={false} texto="Guardar" textoAlEnviar="Guardando…" /></button>);

    expect(screen.getByRole("button")).toHaveTextContent("Guardar");
    expect(container.querySelector(".pelota-que-rebota")).toBeNull();
  });

  it("al enviar muestra la pelotita y el texto de espera", () => {
    const { container } = render(<button type="button"><TextoDeEnvio enviando texto="Guardar" textoAlEnviar="Guardando…" /></button>);

    expect(screen.getByRole("button")).toHaveAccessibleName("Guardando…");
    expect(container.querySelector(".pelota-que-rebota--boton")).not.toBeNull();
  });
});
