import { describe, expect, it } from "vitest";
import { analizarContrasena } from "./seguridad-contrasena";

describe("analizarContrasena", () => {
  it("califica como débil una de las contraseñas más usadas y explica por qué", async () => {
    await expect(analizarContrasena("123456789a", [])).resolves.toEqual({
      nivel: "debil",
      aviso: "Es de las contraseñas más usadas.",
    });
  });

  it("califica como muy buena una contraseña larga y difícil de adivinar", async () => {
    await expect(analizarContrasena("Tq7#vR2!mZp9$Lw4", [])).resolves.toEqual({
      nivel: "muy-buena",
    });
  });

  it("avisa cuando la contraseña usa datos de la persona", async () => {
    const resultado = await analizarContrasena("valeria1998", ["Valeria", "León"]);

    expect(resultado.nivel).toBe("debil");
    expect(resultado.aviso).toBe(
      "No debería haber datos personales o relacionados con esta página.",
    );
  });

  it("penaliza las palabras del propio club", async () => {
    const resultado = await analizarContrasena("Previa2026!", []);

    expect(["debil", "aceptable"]).toContain(resultado.nivel);
  });
});
