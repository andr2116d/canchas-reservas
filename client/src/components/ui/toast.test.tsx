import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProveedorToast, useToast } from "./toast";

function Disparador() {
  const toast = useToast();
  return <button onClick={() => toast.exito("Guardado")}>Mostrar</button>;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Toast", () => {
  it("desaparece a los 4 segundos", () => {
    vi.useFakeTimers();
    render(
      <ProveedorToast>
        <Disparador />
      </ProveedorToast>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mostrar" }));
    expect(screen.getByRole("status").textContent).toBe("Guardado");

    act(() => vi.advanceTimersByTime(3999));
    expect(screen.queryByRole("status")).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
