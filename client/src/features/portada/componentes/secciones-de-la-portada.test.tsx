import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { clubDePrueba } from "../../../../test/compartido/club/club-de-prueba";
import { CanchasDelClub } from "./canchas-del-club";
import { ContactoDelClub } from "./contacto-del-club";
import { PreciosDelClub } from "./precios-del-club";
import { PreguntasFrecuentes } from "./preguntas-frecuentes";
import { Promesas } from "./promesas";

// La foto no importa en estas pruebas: basta con que la sección se arme.
vi.mock("next/image", () => ({ default: () => null }));

const club = clubDePrueba();

describe("Secciones de la portada", () => {
  it("las promesas dicen con qué porcentaje se separa un turno", () => {
    render(<Promesas adelanto={50} />);

    expect(screen.getByText("Sepáralo con el 50 %")).toBeInTheDocument();
  });

  it("cada cancha dice su tipo, si tiene luz, sus detalles y su nota; el filtro deja ver un tipo", async () => {
    const usuario = userEvent.setup();
    render(<CanchasDelClub canchas={club.canchas} />);

    const cancha = screen.getByRole("article", { name: "Cancha 1" });
    expect(cancha).toHaveTextContent("Con luz para jugar de noche");
    expect(within(cancha).getByRole("list", { name: "Detalles" })).toHaveTextContent("Bancas");
    expect(screen.getByRole("article", { name: "Cancha 2" })).toHaveTextContent("Solo con luz natural");
    await usuario.click(screen.getByRole("button", { name: "Fútbol 7" }));
    expect(screen.queryByRole("article", { name: "Cancha 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Cancha 3" })).toBeInTheDocument();
  });

  it("los precios muestran día y noche por tipo y cuánto pone cada uno", () => {
    render(<PreciosDelClub tarifas={club.tarifas} horario={club.horario} adelanto={50} />);

    expect(screen.getByRole("article", { name: "Bajo los reflectores" })).toHaveTextContent("S/ 80.00");
    expect(screen.getByText(/Entre 10, un turno de fútbol 5 de noche sale a/)).toHaveTextContent("S/ 8.00");
  });

  it("sin tarifas guardadas no inventa precios", () => {
    render(<PreciosDelClub tarifas={[]} horario={null} adelanto={null} />);

    expect(screen.getByText("Pronto publicaremos nuestros precios.")).toBeInTheDocument();
  });

  it("las preguntas responden con la regla de cancelación y los adicionales guardados", () => {
    render(<PreguntasFrecuentes cancelacion={club.cancelacion} adicionales={club.adicionales} />);

    expect(screen.getByRole("table")).toHaveTextContent("24 horas antes o más");
    expect(screen.getByText("Balón")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver la política completa" })).toHaveAttribute("href", "/legal/cancelaciones");
  });

  it("el contacto muestra el horario agrupado y dice qué datos faltan configurar", () => {
    render(<ContactoDelClub horario={club.horario} />);

    expect(screen.getByText("Lunes").nextSibling).toHaveTextContent("08:00 – 23:00");
    expect(screen.getByText("Martes a domingo").nextSibling).toHaveTextContent("Cerrado");
    expect(screen.getAllByText("Se configura en administración")).toHaveLength(3);
  });
});
