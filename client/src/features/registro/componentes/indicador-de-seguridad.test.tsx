import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { analizarContrasena } from "../servicios/seguridad-contrasena";
import { RegistroDeJugador } from "./registro-de-jugador";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("../servicios/seguridad-contrasena", () => ({ analizarContrasena: vi.fn() }));

const analizarSimulado = vi.mocked(analizarContrasena);
const campo = (nombre: string) => screen.getByLabelText(new RegExp(`^${nombre}`));

describe("Indicador de seguridad de la contraseña", () => {
  afterEach(() => vi.clearAllMocks());

  it("no aparece mientras no se escribe una contraseña", () => {
    render(<RegistroDeJugador />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(analizarSimulado).not.toHaveBeenCalled();
  });

  it("muestra el nivel y el aviso mientras se escribe", async () => {
    analizarSimulado.mockResolvedValue({
      nivel: "debil",
      aviso: "Es de las contraseñas más usadas.",
    });
    const persona = userEvent.setup();
    render(<RegistroDeJugador />);

    await persona.type(campo("Contraseña"), "123456789a");

    const indicador = await screen.findByRole("status");
    expect(indicador).toHaveTextContent("Seguridad de la contraseña: Débil");
    expect(indicador).toHaveTextContent("Es de las contraseñas más usadas.");
  });

  it("muestra cuando la contraseña es muy buena", async () => {
    analizarSimulado.mockResolvedValue({ nivel: "muy-buena" });
    const persona = userEvent.setup();
    render(<RegistroDeJugador />);

    await persona.type(campo("Contraseña"), "Tq7#vR2!mZp9$Lw4");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Seguridad de la contraseña: Muy buena",
    );
  });

  it("considera los datos de la persona al analizar", async () => {
    analizarSimulado.mockResolvedValue({ nivel: "debil" });
    const persona = userEvent.setup();
    render(<RegistroDeJugador />);
    await persona.type(campo("Nombres"), "Valeria");

    await persona.type(campo("Contraseña"), "v");

    expect(analizarSimulado).toHaveBeenLastCalledWith(
      "v",
      expect.arrayContaining(["Valeria"]),
    );
  });
});
