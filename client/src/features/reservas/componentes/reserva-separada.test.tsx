import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { miReservaDePrueba } from "../../../../test/features/reservas/mi-reserva-de-prueba";
import { ReservaSeparada } from "./reserva-separada";

describe("ReservaSeparada", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("muestra el código, cuánto queda guardado el turno y qué pasa al vencer", () => {
    render(<ReservaSeparada reserva={miReservaDePrueba()} />);

    expect(screen.getByRole("heading", { name: "Turno separado" })).toBeInTheDocument();
    expect(screen.getByText("7K3Q9X")).toBeInTheDocument();
    expect(screen.getByRole("timer", { name: "Tiempo que queda" })).toHaveTextContent("15:00");
    expect(screen.getByText(/antes de las 10:15, el turno se libera solo y no se cobra nada/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagar S/ 40.00 de adelanto" })).toBeDisabled();
  });

  it("muestra los montos y el material que tendrán listo", () => {
    render(<ReservaSeparada reserva={miReservaDePrueba()} />);

    const montos = screen.getByRole("region", { name: "Lo que pagas" });
    expect(montos).toHaveTextContent("Precio final, con IGVS/ 80.00");
    expect(montos).toHaveTextContent("El resto, en el localS/ 40.00");
    expect(montos).toHaveTextContent("Te tendrán listo: Balón.");
  });

  it("al terminar el tiempo dice que venció y ofrece reservar otro turno", () => {
    render(<ReservaSeparada reserva={miReservaDePrueba({ venceEn: "2026-11-27T15:00:02.000Z" })} />);

    act(() => vi.advanceTimersByTime(3000));

    expect(screen.getByRole("heading", { name: "La reserva venció" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reservar otro turno" })).toHaveAttribute("href", "/inicio/reservar");
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });

  it("una reserva que ya expiró lo dice sin contar nada", () => {
    render(<ReservaSeparada reserva={miReservaDePrueba({ estado: "EXPIRADA" })} />);

    expect(screen.getByRole("heading", { name: "La reserva venció" })).toBeInTheDocument();
  });
});
