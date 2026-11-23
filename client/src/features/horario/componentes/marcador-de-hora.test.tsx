import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { MarcadorDeHora, type MarcadorDeHoraProps } from "./marcador-de-hora";

function Marcador({ inicial = "08:00", alCambiar = vi.fn(), ...props }: Partial<MarcadorDeHoraProps> & { inicial?: string }) {
  const [valor, setValor] = useState(inicial);
  return (
    <MarcadorDeHora
      id="abre"
      etiqueta="Abre"
      valor={valor}
      alCambiar={(nuevo) => {
        setValor(nuevo);
        alCambiar(nuevo);
      }}
      {...props}
    />
  );
}

const horas = () => screen.getByRole("spinbutton", { name: "Horas de Abre" });
const minutos = () => screen.getByRole("spinbutton", { name: "Minutos de Abre" });

describe("MarcadorDeHora", () => {
  it("muestra la hora y los minutos como en un marcador", () => {
    render(<Marcador inicial="07:45" />);

    expect(screen.getByRole("group", { name: "Abre" })).toBeInTheDocument();
    expect(horas()).toHaveValue("07");
    expect(minutos()).toHaveValue("45");
  });

  it("sube y baja con las flechas del teclado", async () => {
    const alCambiar = vi.fn();
    render(<Marcador alCambiar={alCambiar} />);

    horas().focus();
    await userEvent.keyboard("{ArrowUp}");
    minutos().focus();
    await userEvent.keyboard("{ArrowDown}");

    expect(alCambiar).toHaveBeenNthCalledWith(1, "09:00");
    expect(alCambiar).toHaveBeenLastCalledWith("09:55");
  });

  it("sube con los botones del marcador", async () => {
    const alCambiar = vi.fn();
    render(<Marcador alCambiar={alCambiar} />);

    await userEvent.click(screen.getByRole("button", { name: "Subir horas de Abre" }));
    await userEvent.click(screen.getByRole("button", { name: "Subir minutos de Abre" }));

    expect(alCambiar).toHaveBeenLastCalledWith("09:05");
  });

  it("deja escribir la hora exacta y pasa a los minutos", async () => {
    const alCambiar = vi.fn();
    render(<Marcador alCambiar={alCambiar} />);

    await userEvent.click(horas());
    await userEvent.keyboard("21");
    expect(minutos()).toHaveFocus();
    await userEvent.keyboard("37");
    await userEvent.tab();

    expect(alCambiar).toHaveBeenLastCalledWith("21:37");
  });

  it("corrige lo que no existe al salir del campo", async () => {
    const alCambiar = vi.fn();
    render(<Marcador alCambiar={alCambiar} />);

    await userEvent.click(horas());
    await userEvent.keyboard("9");
    await userEvent.click(minutos());
    await userEvent.keyboard("75");

    expect(alCambiar).toHaveBeenCalledWith("09:00");
    expect(alCambiar).toHaveBeenLastCalledWith("09:59");
  });

  it("el cierre puede llegar a las 24:00 y entonces no tiene minutos", async () => {
    const alCambiar = vi.fn();
    render(<Marcador inicial="23:30" hastaMedianoche alCambiar={alCambiar} />);

    horas().focus();
    await userEvent.keyboard("{ArrowUp}");

    expect(alCambiar).toHaveBeenLastCalledWith("24:00");
    expect(minutos()).toBeDisabled();
  });

  it("cambia con la rueda del mouse mientras tiene el foco", () => {
    const alCambiar = vi.fn();
    render(<Marcador alCambiar={alCambiar} />);

    horas().focus();
    fireEvent.wheel(horas(), { deltaY: -100 });

    expect(alCambiar).toHaveBeenLastCalledWith("09:00");
  });

  it("ofrece atajos de horas comunes", async () => {
    const alCambiar = vi.fn();
    render(<Marcador alCambiar={alCambiar} atajos={["18:00", "19:00"]} />);

    await userEvent.click(screen.getByRole("button", { name: "19:00" }));

    expect(alCambiar).toHaveBeenLastCalledWith("19:00");
  });

  it("muestra el error y lo asocia al marcador", () => {
    render(<Marcador error="El cierre debe ser después de la apertura." />);

    expect(horas()).toHaveAccessibleDescription("El cierre debe ser después de la apertura.");
    expect(horas()).toHaveAttribute("aria-invalid", "true");
  });
});
