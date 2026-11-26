import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { describe, expect, it } from "vitest";
import { PantallaDeAviso } from "./pantalla-de-aviso";

function avisoDePrueba(codigo?: string) {
  return render(
    <PantallaDeAviso codigo={codigo} titulo="Esta cancha no existe" mensaje="Revisa la dirección.">
      <Link href="/">Volver al inicio</Link>
    </PantallaDeAviso>,
  );
}

describe("PantallaDeAviso", () => {
  it("muestra el título como encabezado principal, el mensaje y la acción", () => {
    avisoDePrueba("404");

    expect(screen.getByRole("heading", { level: 1, name: "Esta cancha no existe" })).toBeInTheDocument();
    expect(screen.getByText("Revisa la dirección.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  });

  it("anuncia el código a lectores de pantalla", () => {
    avisoDePrueba("403");

    expect(screen.getByText("Error 403")).toHaveClass("sr-only");
  });

  it("dibuja el balón en lugar del cero del código", () => {
    const { container } = avisoDePrueba("404");

    const codigo = container.querySelector(".pantalla-de-aviso__codigo");
    expect(codigo).toHaveAttribute("aria-hidden", "true");
    expect(codigo?.textContent).toBe("44");
    expect(codigo?.querySelectorAll("svg")).toHaveLength(1);
  });

  it("sin código muestra solo el balón", () => {
    const { container } = avisoDePrueba();

    expect(screen.queryByText(/^Error/)).not.toBeInTheDocument();
    expect(container.querySelector(".pantalla-de-aviso__codigo")?.textContent).toBe("");
    expect(container.querySelectorAll(".pantalla-de-aviso__codigo svg")).toHaveLength(1);
  });

  it("ocupa la pantalla con la cancha", () => {
    avisoDePrueba("404");

    expect(screen.getByRole("main")).toHaveClass("cancha-completa");
  });
});
