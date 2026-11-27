import { TARJETA } from "@/compartido/ui/estilos";
import { enSoles } from "@/compartido/ui/textos-del-local";
import type { AdicionalOfrecido } from "../servicios/reservas";

interface MaterialDelLocalProps {
  adicionales: AdicionalOfrecido[];
  pedidos: number[];
  alternar: (id: number) => void;
}

/** El material que presta el local: se marca lo que se quiere tener listo; nada viene marcado. */
export function MaterialDelLocal({ adicionales, pedidos, alternar }: MaterialDelLocalProps) {
  if (adicionales.length === 0) return null;
  return (
    <fieldset className={TARJETA}>
      <legend className="sr-only">Material del local</legend>
      <h2 aria-hidden="true" className="font-titular text-3xl font-black text-cancha">Material del local</h2>
      <p className="mt-1 text-sm text-grava">Marca lo que quieres que te tengan listo. No se cobra: solo se paga si se pierde o se rompe.</p>
      <ul className="mt-4 grid gap-2">
        {adicionales.map((adicional) => (
          <li key={adicional.id}>
            <label className="material-del-local__opcion">
              <input type="checkbox" checked={pedidos.includes(adicional.id)} onChange={() => alternar(adicional.id)} />
              <span className="flex flex-col">
                <span className="font-bold">{adicional.nombre}</span>
                {adicional.descripcion && <span className="text-sm text-grava">{adicional.descripcion}</span>}
                <span className="text-sm text-grava">{enSoles(adicional.precio)} por unidad perdida o rota</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
