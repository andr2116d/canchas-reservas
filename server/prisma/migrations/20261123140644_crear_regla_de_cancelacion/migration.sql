-- CreateTable
CREATE TABLE "regla_de_cancelacion" (
    "id" SERIAL NOT NULL,
    "guardada_por_id" INTEGER NOT NULL,
    "guardada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regla_de_cancelacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rango_de_cancelacion" (
    "regla_id" INTEGER NOT NULL,
    "desde_horas" SMALLINT NOT NULL,
    "porcentaje" SMALLINT NOT NULL,
    "ofrece_credito" BOOLEAN NOT NULL,

    CONSTRAINT "rango_de_cancelacion_pkey" PRIMARY KEY ("regla_id","desde_horas")
);

-- CreateIndex
CREATE INDEX "regla_de_cancelacion_guardada_en_idx" ON "regla_de_cancelacion"("guardada_en");

-- AddForeignKey
ALTER TABLE "regla_de_cancelacion" ADD CONSTRAINT "regla_de_cancelacion_guardada_por_id_fkey" FOREIGN KEY ("guardada_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rango_de_cancelacion" ADD CONSTRAINT "rango_de_cancelacion_regla_id_fkey" FOREIGN KEY ("regla_id") REFERENCES "regla_de_cancelacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Horas enteras de 0 a 720, porcentaje de 0 a 100 y crédito solo si el rango devuelve algo.
ALTER TABLE "rango_de_cancelacion"
  ADD CONSTRAINT "rango_de_cancelacion_desde_horas_check" CHECK ("desde_horas" BETWEEN 0 AND 720),
  ADD CONSTRAINT "rango_de_cancelacion_porcentaje_check" CHECK ("porcentaje" BETWEEN 0 AND 100),
  ADD CONSTRAINT "rango_de_cancelacion_credito_check" CHECK (NOT "ofrece_credito" OR "porcentaje" > 0);
