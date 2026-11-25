import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AvisoDeCookies } from "./aviso-de-cookies";
import { abrirPreferencias, leerPreferencia } from "./preferencia-de-cookies";

const aviso = () => screen.queryByRole("region", { name: "Tus cookies, tu decisión." });

describe("AvisoDeCookies", () => {
  afterEach(() => {
    document.cookie = "preferencia_de_cookies=; max-age=0; path=/";
  });

  it("pregunta mientras no se haya elegido, con rechazar y aceptar al mismo nivel", () => {
    render(<AvisoDeCookies />);

    const solo = screen.getByRole("button", { name: "Solo necesarias" });
    const todas = screen.getByRole("button", { name: "Aceptar todas" });
    expect(aviso()).toBeInTheDocument();
    expect(solo.className.split(" ")[0]).toBe(todas.className.split(" ")[0]);
    expect(screen.getByRole("link", { name: "Política de cookies" })).toHaveAttribute("href", "/legal/cookies");
  });

  it("rechazar las opcionales guarda la elección y cierra el aviso", async () => {
    const usuario = userEvent.setup();
    render(<AvisoDeCookies />);

    await usuario.click(screen.getByRole("button", { name: "Solo necesarias" }));

    expect(leerPreferencia()).toBe("necesarias");
    expect(aviso()).not.toBeInTheDocument();
  });

  it("deja elegir por tipo: las necesarias no se pueden quitar y la medición empieza sin marcar", async () => {
    const usuario = userEvent.setup();
    render(<AvisoDeCookies />);

    await usuario.click(screen.getByRole("button", { name: "Elegir cuáles" }));
    expect(screen.getByRole("checkbox", { name: /Necesarias/ })).toBeDisabled();
    const medicion = screen.getByRole("checkbox", { name: /Medición/ });
    expect(medicion).not.toBeChecked();
    await usuario.click(medicion);
    await usuario.click(screen.getByRole("button", { name: "Guardar mi elección" }));

    expect(leerPreferencia()).toBe("todas");
  });

  it("con la elección hecha no aparece, pero se vuelve a abrir desde el pie", () => {
    document.cookie = "preferencia_de_cookies=necesarias; path=/";
    render(<AvisoDeCookies />);
    expect(aviso()).not.toBeInTheDocument();

    act(() => abrirPreferencias());

    expect(aviso()).toBeInTheDocument();
  });
});
