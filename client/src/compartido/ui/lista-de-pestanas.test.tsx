import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ListaDePestanas } from "./lista-de-pestanas";

const PESTANAS = [
  { valor: "datos", texto: "Mis datos" },
  { valor: "seguridad", texto: "Seguridad" },
  { valor: "actividad", texto: "Actividad" },
] as const;

function Prueba() {
  const [activa, setActiva] = useState<(typeof PESTANAS)[number]["valor"]>("datos");
  return <ListaDePestanas etiqueta="Secciones" pestanas={PESTANAS} activa={activa} alElegir={setActiva} />;
}

describe("ListaDePestanas", () => {
  afterEach(cleanup);

  it("marca la pestaña activa y solo ella entra en el orden del tabulador", () => {
    render(<Prueba />);

    expect(screen.getByRole("tab", { name: "Mis datos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Mis datos" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Seguridad" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("tab", { name: "Seguridad" })).toHaveAttribute("aria-controls", "panel-seguridad");
  });

  it("con las flechas pasa a la siguiente y a la anterior, y da la vuelta", async () => {
    const usuario = userEvent.setup();
    render(<Prueba />);
    await usuario.tab();

    await usuario.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Seguridad" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Seguridad" })).toHaveAttribute("aria-selected", "true");
    await usuario.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Mis datos" })).toHaveFocus();
    await usuario.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Actividad" })).toHaveAttribute("aria-selected", "true");
  });

  it("Inicio y Fin llevan a la primera y a la última", async () => {
    const usuario = userEvent.setup();
    render(<Prueba />);
    await usuario.tab();

    await usuario.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Actividad" })).toHaveFocus();
    await usuario.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Mis datos" })).toHaveFocus();
  });

  it("con un clic elige la pestaña", async () => {
    render(<Prueba />);

    await userEvent.click(screen.getByRole("tab", { name: "Actividad" }));

    expect(screen.getByRole("tab", { name: "Actividad" })).toHaveAttribute("aria-selected", "true");
  });
});
