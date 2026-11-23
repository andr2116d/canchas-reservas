import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorDelSitio from "./error";

function errorDePrueba() {
  const reintentar = vi.fn();
  render(<ErrorDelSitio error={new Error("La API no responde")} retry={reintentar} reset={vi.fn()} />);
  return reintentar;
}

describe("Error del sitio", () => {
  it("avisa que la página no cargó sin mostrar el detalle técnico", () => {
    errorDePrueba();

    expect(screen.getByRole("heading", { level: 1, name: "Se cortó la jugada" })).toBeInTheDocument();
    expect(screen.getByText("No pudimos cargar esta página. Intenta de nuevo en unos segundos.")).toBeInTheDocument();
    expect(screen.queryByText(/API/)).not.toBeInTheDocument();
  });

  it("vuelve a cargar la página al intentar de nuevo", async () => {
    const reintentar = errorDePrueba();

    await userEvent.click(screen.getByRole("button", { name: "Intentar de nuevo" }));

    expect(reintentar).toHaveBeenCalledOnce();
  });

  it("ofrece volver al inicio", () => {
    errorDePrueba();

    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  });
});
