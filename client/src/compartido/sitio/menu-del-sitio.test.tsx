import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MenuDelSitio } from "./menu-del-sitio";

describe("MenuDelSitio", () => {
  it("lleva a cada sección de la portada desde cualquier página", () => {
    render(<MenuDelSitio />);

    expect(screen.getByRole("link", { name: "Canchas" })).toHaveAttribute("href", "/#canchas");
    expect(screen.getByRole("link", { name: "Contacto" })).toHaveAttribute("href", "/#contacto");
  });

  it("en el celular se abre con «Menú» y se cierra al elegir una sección", async () => {
    const usuario = userEvent.setup();
    render(<MenuDelSitio />);
    const boton = screen.getByRole("button", { name: "Menú" });

    await usuario.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(boton).toHaveTextContent("Cerrar");
    await usuario.click(screen.getByRole("link", { name: "Precios" }));

    expect(boton).toHaveAttribute("aria-expanded", "false");
  });
});
