import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BotonDeCopiar } from "./boton-de-copiar";

describe("BotonDeCopiar", () => {
  it("copia el texto y avisa que lo copió", async () => {
    const usuario = userEvent.setup();
    const escribir = vi.spyOn(navigator.clipboard, "writeText");
    render(<BotonDeCopiar texto={() => "Correo: rosa@laprevia.pe"} />);

    await usuario.click(screen.getByRole("button", { name: "Copiar datos" }));

    expect(escribir).toHaveBeenCalledWith("Correo: rosa@laprevia.pe");
    expect(await screen.findByRole("status")).toHaveTextContent("Datos copiados");
  });

  it("avisa si el navegador no dejó copiar", async () => {
    const usuario = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("sin permiso"));
    render(<BotonDeCopiar texto={() => "x"} />);

    await usuario.click(screen.getByRole("button", { name: "Copiar datos" }));

    expect(await screen.findByRole("status")).toHaveTextContent("No se pudo copiar");
  });
});
