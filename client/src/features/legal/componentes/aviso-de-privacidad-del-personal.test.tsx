import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AvisoDePrivacidadDelPersonal } from "./aviso-de-privacidad-del-personal";

describe("AvisoDePrivacidadDelPersonal", () => {
  afterEach(cleanup);

  it("informa qué datos se usan, para qué, cómo se protegen, cuánto se guardan y los derechos", () => {
    render(<AvisoDePrivacidadDelPersonal />);

    expect(screen.getByRole("heading", { level: 1, name: "Aviso de privacidad del personal" })).toBeInTheDocument();
    for (const seccion of [
      "Qué datos usamos",
      "Para qué los usamos",
      "Por qué no te pedimos consentimiento",
      "Cómo los protegemos",
      "Cuánto tiempo los guardamos",
      "Tus derechos",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: seccion })).toBeInTheDocument();
    }
  });

  it("cita las normas que lo sustentan", () => {
    render(<AvisoDePrivacidadDelPersonal />);

    expect(screen.getByText(/Ley 29733/)).toBeInTheDocument();
    expect(screen.getByText(/artículo 14, numeral 5/)).toBeInTheDocument();
  });
});
