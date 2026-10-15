import { BarraSuperior } from "@/components/layout/barra-superior";
import { GuardiaRol } from "@/features/auth/components/guardia-rol";

export default function LayoutRecepcion({ children }: LayoutProps<"/recepcion">) {
  return (
    <GuardiaRol rol="RECEPCIONISTA">
      <BarraSuperior />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-6">{children}</main>
    </GuardiaRol>
  );
}
