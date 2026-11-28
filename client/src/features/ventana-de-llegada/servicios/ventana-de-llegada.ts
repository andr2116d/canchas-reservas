export interface LimitesDeLlegada {
  minutosAntes: number;
  minutosDespues: number;
}

export interface VersionDeLlegada extends LimitesDeLlegada {
  guardadaEn: string;
  guardadaPor: string;
}

export interface VentanaConsultada {
  inicial: LimitesDeLlegada;
  vigente: VersionDeLlegada | null;
  historial: VersionDeLlegada[];
}
