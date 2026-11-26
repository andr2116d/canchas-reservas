import type { ReactNode } from "react";
import { MarcoDelSitio } from "@/compartido/sitio/marco-del-sitio";

export default function LayoutDelSitio({ children }: { children: ReactNode }) {
  return <MarcoDelSitio>{children}</MarcoDelSitio>;
}
