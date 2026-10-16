export function saltosProxy(valor = process.env.TRUST_PROXY_HOPS) {
  const texto = valor?.trim();
  if (!texto) return 0;
  if (!/^\d+$/.test(texto)) {
    throw new Error(
      `TRUST_PROXY_HOPS debe ser un entero mayor o igual a 0 (recibido: "${valor}")`,
    );
  }
  return Number(texto);
}
