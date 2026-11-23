-- CreateEnum
CREATE TYPE "dia_de_la_semana" AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');

-- CreateTable
CREATE TABLE "horario_de_atencion" (
    "id" SERIAL NOT NULL,
    "minuto_de_inicio_de_la_noche" SMALLINT NOT NULL,
    "guardado_por_id" INTEGER NOT NULL,
    "guardado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horario_de_atencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horario_del_dia" (
    "horario_id" INTEGER NOT NULL,
    "dia" "dia_de_la_semana" NOT NULL,
    "minuto_de_apertura" SMALLINT NOT NULL,
    "minuto_de_cierre" SMALLINT NOT NULL,
    "minuto_de_inicio_de_la_noche" SMALLINT,

    CONSTRAINT "horario_del_dia_pkey" PRIMARY KEY ("horario_id","dia")
);

-- CreateIndex
CREATE INDEX "horario_de_atencion_guardado_en_idx" ON "horario_de_atencion"("guardado_en");

-- AddForeignKey
ALTER TABLE "horario_de_atencion" ADD CONSTRAINT "horario_de_atencion_guardado_por_id_fkey" FOREIGN KEY ("guardado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_del_dia" ADD CONSTRAINT "horario_del_dia_horario_id_fkey" FOREIGN KEY ("horario_id") REFERENCES "horario_de_atencion"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Las horas van de 00:00 a 23:59; el cierre puede ser 24:00 y siempre es posterior a la apertura.
ALTER TABLE "horario_de_atencion"
  ADD CONSTRAINT "horario_de_atencion_inicio_de_la_noche_check" CHECK ("minuto_de_inicio_de_la_noche" BETWEEN 0 AND 1439);
ALTER TABLE "horario_del_dia"
  ADD CONSTRAINT "horario_del_dia_apertura_check" CHECK ("minuto_de_apertura" BETWEEN 0 AND 1439),
  ADD CONSTRAINT "horario_del_dia_cierre_check" CHECK ("minuto_de_cierre" <= 1440 AND "minuto_de_cierre" > "minuto_de_apertura"),
  ADD CONSTRAINT "horario_del_dia_inicio_de_la_noche_check" CHECK ("minuto_de_inicio_de_la_noche" BETWEEN 0 AND 1439);
