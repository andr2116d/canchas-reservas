-- CreateEnum
CREATE TYPE "tipo_de_hoja" AS ENUM ('reclamo', 'queja');

-- CreateEnum
CREATE TYPE "servicio_reclamado" AS ENUM ('reserva_de_cancha', 'material_adicional', 'otro');

-- CreateEnum
CREATE TYPE "medio_de_respuesta" AS ENUM ('correo', 'carta');

-- CreateEnum
CREATE TYPE "estado_de_hoja" AS ENUM ('nueva', 'en_atencion', 'respondida');

-- CreateTable
CREATE TABLE "hoja_de_reclamacion" (
    "id" SERIAL NOT NULL,
    "anio" SMALLINT NOT NULL,
    "correlativo" INTEGER NOT NULL,
    "codigo_seguimiento_hash" TEXT NOT NULL,
    "titular_id" INTEGER,
    "tipo_documento" "tipo_documento" NOT NULL,
    "numero_documento_cifrado" TEXT NOT NULL,
    "nombres_cifrado" TEXT NOT NULL,
    "apellidos_cifrado" TEXT NOT NULL,
    "domicilio_cifrado" TEXT NOT NULL,
    "telefono_cifrado" TEXT NOT NULL,
    "correo_cifrado" TEXT NOT NULL,
    "es_menor_de_edad" BOOLEAN NOT NULL,
    "representante_nombre_cifrado" TEXT,
    "representante_domicilio_cifrado" TEXT,
    "representante_telefono_cifrado" TEXT,
    "representante_correo_cifrado" TEXT,
    "servicio" "servicio_reclamado" NOT NULL,
    "monto_reclamado" DECIMAL(10,2),
    "descripcion_del_servicio_cifrada" TEXT,
    "tipo_marcado" "tipo_de_hoja" NOT NULL,
    "tipo" "tipo_de_hoja" NOT NULL,
    "detalle_cifrado" TEXT NOT NULL,
    "pedido_cifrado" TEXT NOT NULL,
    "medio_de_respuesta" "medio_de_respuesta" NOT NULL,
    "estado" "estado_de_hoja" NOT NULL DEFAULT 'nueva',
    "registrada_en" TIMESTAMPTZ(3) NOT NULL,
    "fecha_limite" DATE NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "hoja_de_reclamacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correlativo_de_hoja" (
    "anio" SMALLINT NOT NULL,
    "ultimo" INTEGER NOT NULL,

    CONSTRAINT "correlativo_de_hoja_pkey" PRIMARY KEY ("anio")
);

-- CreateIndex
CREATE INDEX "hoja_de_reclamacion_estado_fecha_limite_idx" ON "hoja_de_reclamacion"("estado", "fecha_limite");

-- CreateIndex
CREATE INDEX "hoja_de_reclamacion_titular_id_idx" ON "hoja_de_reclamacion"("titular_id");

-- CreateIndex
CREATE UNIQUE INDEX "hoja_de_reclamacion_anio_correlativo_key" ON "hoja_de_reclamacion"("anio", "correlativo");

-- AddForeignKey
ALTER TABLE "hoja_de_reclamacion" ADD CONSTRAINT "hoja_de_reclamacion_titular_id_fkey" FOREIGN KEY ("titular_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Quien es menor de edad reclama con los datos de su padre, madre o representante (DS 011-2011-PCM, art. 5).
ALTER TABLE "hoja_de_reclamacion" ADD CONSTRAINT "hoja_de_reclamacion_representante_check" CHECK (
  NOT "es_menor_de_edad" OR (
    "representante_nombre_cifrado" IS NOT NULL AND "representante_domicilio_cifrado" IS NOT NULL
    AND "representante_telefono_cifrado" IS NOT NULL AND "representante_correo_cifrado" IS NOT NULL
  )
);

ALTER TABLE "hoja_de_reclamacion" ADD CONSTRAINT "hoja_de_reclamacion_monto_reclamado_check"
  CHECK ("monto_reclamado" IS NULL OR "monto_reclamado" > 0);

-- Las hojas se conservan al menos dos años (DS 011-2011-PCM, art. 12): ninguna fila se borra.
CREATE FUNCTION impedir_borrar_hoja_de_reclamacion() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Las hojas de reclamación no se borran.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hoja_de_reclamacion_no_se_borra
  BEFORE DELETE ON "hoja_de_reclamacion"
  FOR EACH ROW EXECUTE FUNCTION impedir_borrar_hoja_de_reclamacion();
