import type { ReactNode } from "react";

const ICONO = { className: "size-7 text-capitan", fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24", "aria-hidden": true } as const;

function promesas(adelanto: number | null): { icono: ReactNode; titulo: string; texto: string }[] {
  return [
    { icono: <svg {...ICONO}><circle cx="12" cy="12" r="3" /><path d="M5 12a7 7 0 0 1 14 0M2 12a10 10 0 0 1 20 0" /></svg>, titulo: "Turnos en vivo", texto: "El mapa se actualiza solo: lo que ves libre, está libre." },
    { icono: <svg {...ICONO}><rect x="4" y="7" width="16" height="10" rx="1" /><path d="M8 12h8" /></svg>, titulo: "Precio final, con IGV", texto: "Sin cargos que aparezcan al pagar." },
    {
      icono: <svg {...ICONO}><path d="M12 3v18M7 8h7a3 3 0 0 1 0 6H8" /></svg>,
      titulo: adelanto ? `Sepáralo con el ${adelanto} %` : "Sepáralo con un adelanto",
      texto: "O paga el total. El resto, en el local.",
    },
    { icono: <svg {...ICONO}><path d="M5 12l4 4 10-10" /></svg>, titulo: "Reglas claras", texto: "Sabes cuánto se devuelve antes de cancelar." },
  ];
}

/** Lo que el club asegura a quien reserva; todo sale de las reglas que ya aplica el sistema. */
export function Promesas({ adelanto }: { adelanto: number | null }) {
  return (
    <section aria-label="Lo que te asegura La Previa" className="bg-cancha text-tiza">
      <ul className="promesas envoltura-del-sitio">
        {promesas(adelanto).map((promesa) => (
          <li key={promesa.titulo}>
            {promesa.icono}
            <strong className="text-lg text-papel">{promesa.titulo}</strong>
            <span className="text-sm text-tiza/75">{promesa.texto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
