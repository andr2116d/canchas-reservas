import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RutaNoEncontrada from "./not-found";

describe("Ruta no encontrada", () => {
  it("avisa que la página no existe y ofrece volver al inicio", () => {
    render(<RutaNoEncontrada />);

    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Esta cancha no existe" })).toBeInTheDocument();
    expect(screen.getByText("La dirección que abriste no lleva a ninguna página.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  });
});
