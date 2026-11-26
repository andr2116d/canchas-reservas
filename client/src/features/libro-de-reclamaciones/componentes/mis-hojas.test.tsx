import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MisHojas } from "./mis-hojas";

describe("MisHojas", () => {
  it("sin hojas ofrece registrar una", () => {
    render(<MisHojas hojas={[]} />);

    expect(screen.getByText("No registraste hojas con tu cuenta.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Registrar un reclamo o queja" })).toHaveAttribute("href", "/libro-de-reclamaciones");
  });

  it("muestra cada hoja con su estado y lleva a su detalle", () => {
    render(
      <MisHojas
        hojas={[
          { numero: "000014-2026", tipo: "RECLAMO", estado: "EN_ATENCION", registradaEn: "2026-11-25T15:00:00.000Z", fechaLimite: "2026-12-16", diasHabilesRestantes: 10, resumen: "La cancha estaba ocupada." },
          { numero: "000006-2026", tipo: "QUEJA", estado: "RESPONDIDA", registradaEn: "2026-11-02T15:00:00.000Z", fechaLimite: "2026-11-23", diasHabilesRestantes: null, resumen: "No me dieron los chalecos." },
        ]}
      />,
    );

    const enAtencion = screen.getByRole("link", { name: /000014-2026/ });
    expect(enAtencion).toHaveAttribute("href", "/inicio/reclamos/000014-2026");
    expect(enAtencion).toHaveTextContent("En atención");
    expect(enAtencion).toHaveTextContent(/Respuesta a más tardar el miércoles, 16 de diciembre|Respuesta a más tardar el miércoles 16 de diciembre/);
    expect(screen.getByRole("link", { name: /000006-2026/ })).toHaveTextContent("Respondida · mira la respuesta");
  });
});
