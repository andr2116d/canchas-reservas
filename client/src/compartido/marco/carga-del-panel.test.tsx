import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CargaDelPanel } from "./carga-del-panel";

const ruta = vi.hoisted(() => ({ actual: "/administracion/recepcionistas" }));
vi.mock("next/navigation", () => ({ usePathname: () => ruta.actual }));

describe("CargaDelPanel", () => {
  it("muestra al instante el título de la sección y espera solo en el contenido", () => {
    const { container } = render(<CargaDelPanel />);

    expect(screen.getByRole("heading", { name: "Recepcionistas" })).toBeInTheDocument();
    expect(container.querySelector(".carga-de-contenido")).toHaveTextContent("Cargando recepcionistas…");
  });

  it("en una subruta usa el nombre de su sección y en la cuenta, Mi cuenta", () => {
    ruta.actual = "/administracion/recepcionistas/nueva";
    const { unmount } = render(<CargaDelPanel />);
    expect(screen.getByRole("heading", { name: "Recepcionistas" })).toBeInTheDocument();
    unmount();

    ruta.actual = "/recepcion/cuenta";
    const { container } = render(<CargaDelPanel />);
    expect(screen.getByRole("heading", { name: "Mi cuenta" })).toBeInTheDocument();
    expect(container.querySelector(".carga-de-contenido")).toHaveTextContent("Cargando mi cuenta…");
  });
});
