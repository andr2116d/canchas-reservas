import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { clubDePrueba } from "../../../../test/compartido/club/club-de-prueba";
import { apartadosDeLasCancelaciones } from "../documentos/cancelaciones";
import { APARTADOS_DE_LOS_TERMINOS } from "../documentos/terminos";
import { DocumentoLegal } from "./documento-legal";

describe("DocumentoLegal", () => {
  it("dice desde cuándo rige y tiene un índice que lleva a cada apartado", () => {
    render(<DocumentoLegal titulo="Términos y condiciones" resumen="…" vigenteDesde="24 de noviembre de 2026" apartados={APARTADOS_DE_LOS_TERMINOS} />);

    expect(screen.getByRole("heading", { level: 1, name: "Términos y condiciones" })).toBeInTheDocument();
    expect(screen.getByText(/Vigente desde el/)).toHaveTextContent("24 de noviembre de 2026");
    const indice = screen.getByRole("navigation", { name: "En esta página" });
    expect(within(indice).getByRole("link", { name: "¿Quién presta el servicio?" })).toHaveAttribute("href", "#quien");
  });

  it("la política de cancelaciones muestra la regla guardada con un ejemplo en soles", () => {
    const club = clubDePrueba();
    render(<DocumentoLegal titulo="Cancelaciones" resumen="…" vigenteDesde="hoy" apartados={apartadosDeLasCancelaciones(club)} />);

    const regla = screen.getByRole("table");
    expect(regla).toHaveTextContent("24 horas antes o más");
    expect(regla).toHaveTextContent("Recibes S/ 100.00");
    expect(screen.getByText(/El adelanto es el 50 %/)).toBeInTheDocument();
  });

  it("sin regla guardada no inventa porcentajes", () => {
    render(<DocumentoLegal titulo="Cancelaciones" resumen="…" vigenteDesde="hoy" apartados={apartadosDeLasCancelaciones({ cancelacion: null, adelanto: null })} />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("aún no se publica")).toBeInTheDocument();
  });
});
