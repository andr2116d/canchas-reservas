import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CampoFecha } from "./campo-fecha";

afterEach(cleanup);

describe("CampoFecha", () => {
  it("muestra la fecha como dd/mm/aaaa y el campo asociado a la etiqueta guarda el valor ISO", () => {
    render(<CampoFecha etiqueta="Fecha" fecha="2026-11-09" onCambiar={() => {}} />);

    expect(screen.getByText("09/11/2026")).toBeTruthy();
    const campo = screen.getByLabelText("Fecha") as HTMLInputElement;
    expect(campo.type).toBe("date");
    expect(campo.value).toBe("2026-11-09");
  });

  it("avisa el cambio con la fecha en formato YYYY-MM-DD", () => {
    const onCambiar = vi.fn();
    render(<CampoFecha etiqueta="Fecha" fecha="2026-11-09" onCambiar={onCambiar} />);

    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2027-01-01" } });

    expect(onCambiar).toHaveBeenCalledWith("2027-01-01");
  });

  it("ignora el valor vacío", () => {
    const onCambiar = vi.fn();
    render(<CampoFecha etiqueta="Fecha" fecha="2026-11-09" onCambiar={onCambiar} />);

    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "" } });

    expect(onCambiar).not.toHaveBeenCalled();
    expect(screen.getByText("09/11/2026")).toBeTruthy();
  });
});
