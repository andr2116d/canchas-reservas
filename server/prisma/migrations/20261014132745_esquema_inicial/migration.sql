-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'RECEPCIONISTA', 'JUGADOR');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('DNI', 'CE');

-- CreateEnum
CREATE TYPE "MotivoAcceso" AS ENUM ('OK', 'CREDENCIALES', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TamanoCancha" AS ENUM ('FUTBOL_5', 'FUTBOL_7');

-- CreateEnum
CREATE TYPE "EstadoCancha" AS ENUM ('OPERATIVA', 'EN_MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "Franja" AS ENUM ('DIA', 'NOCHE');

-- CreateEnum
CREATE TYPE "TipoCompensacion" AS ENUM ('DEVOLUCION', 'CREDITO');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE_PAGO', 'PENDIENTE_VALIDACION', 'CONFIRMADA', 'EN_JUEGO', 'FINALIZADA', 'CANCELADA', 'EXPIRADA', 'AUSENTE');

-- CreateEnum
CREATE TYPE "OrigenReserva" AS ENUM ('PLATAFORMA', 'RECEPCION');

-- CreateEnum
CREATE TYPE "ConceptoPago" AS ENUM ('ADELANTO', 'SALDO', 'ADICIONALES');

-- CreateEnum
CREATE TYPE "CanalPago" AS ENUM ('RECEPCION', 'ONLINE');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA', 'CREDITO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('EN_PROCESO', 'PENDIENTE_VALIDACION', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "MotivoCancelacion" AS ENUM ('CLIENTE', 'INCIDENCIA');

-- CreateEnum
CREATE TYPE "ResultadoCancelacion" AS ENUM ('SIN_COMPENSACION', 'DEVOLUCION', 'CREDITO', 'RETENCION');

-- CreateEnum
CREATE TYPE "EstadoCompensacion" AS ENUM ('NO_APLICA', 'PENDIENTE', 'PARCIAL', 'ATENDIDA');

-- CreateEnum
CREATE TYPE "ResultadoCierre" AS ENUM ('SOBRANTE', 'FALTANTE', 'SIN_DIFERENCIA');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT,
    "tipo_documento" "TipoDocumento" NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "correo" TEXT,
    "telefono" TEXT NOT NULL,
    "password_hash" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'JUGADOR',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "creado_por_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_recuperacion" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_acceso" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "correo" TEXT NOT NULL,
    "exito" BOOLEAN NOT NULL,
    "motivo" "MotivoAcceso" NOT NULL,
    "ip" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" INTEGER,
    "motivo" TEXT,
    "detalle" JSONB,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancha" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tamano" "TamanoCancha" NOT NULL,
    "iluminacion" BOOLEAN NOT NULL,
    "estado" "EstadoCancha" NOT NULL DEFAULT 'OPERATIVA',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cancha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifa" (
    "id" SERIAL NOT NULL,
    "cancha_id" INTEGER NOT NULL,
    "franja" "Franja" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vigente_desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente_hasta" TIMESTAMP(3),
    "creado_por_id" INTEGER NOT NULL,

    CONSTRAINT "tarifa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horario_dia" (
    "dia_semana" INTEGER NOT NULL,
    "abierto" BOOLEAN NOT NULL DEFAULT false,
    "apertura" TEXT,
    "cierre" TEXT,

    CONSTRAINT "horario_dia_pkey" PRIMARY KEY ("dia_semana")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "inicio_noche" TEXT NOT NULL DEFAULT '18:00',
    "tiempo_limite_pago_min" INTEGER NOT NULL DEFAULT 15,
    "minutos_antes_check_in" INTEGER NOT NULL DEFAULT 30,
    "tolerancia_ausencia_min" INTEGER NOT NULL DEFAULT 15,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueo" (
    "id" SERIAL NOT NULL,
    "cancha_id" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "creado_por_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloqueo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regla_cancelacion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "horas_anticipacion" INTEGER NOT NULL DEFAULT 24,
    "tipo_compensacion" "TipoCompensacion" NOT NULL DEFAULT 'CREDITO',
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regla_cancelacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adicional" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adicional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "jugador_id" INTEGER NOT NULL,
    "creado_por_id" INTEGER NOT NULL,
    "origen" "OrigenReserva" NOT NULL DEFAULT 'PLATAFORMA',
    "cancha_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "inicio_en" TIMESTAMP(3) NOT NULL,
    "fin_en" TIMESTAMP(3) NOT NULL,
    "franja" "Franja" NOT NULL,
    "valor_turno" DECIMAL(10,2) NOT NULL,
    "adelanto_minimo" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "vence_en" TIMESTAMP(3),
    "regla_horas_anticipacion" INTEGER NOT NULL,
    "regla_tipo_compensacion" "TipoCompensacion" NOT NULL,
    "confirmada_en" TIMESTAMP(3),
    "check_in_en" TIMESTAMP(3),
    "finalizada_en" TIMESTAMP(3),
    "ausente_en" TIMESTAMP(3),
    "cancelada_en" TIMESTAMP(3),
    "expirada_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "concepto" "ConceptoPago" NOT NULL,
    "canal" "CanalPago" NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoPago" NOT NULL,
    "numero_operacion" TEXT,
    "comprobante_url" TEXT,
    "codigo_transaccion" TEXT,
    "respuesta_pasarela" JSONB,
    "registrado_por_id" INTEGER NOT NULL,
    "validado_por_id" INTEGER,
    "validado_en" TIMESTAMP(3),
    "motivo_rechazo" TEXT,
    "cierre_caja_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumo_adicional" (
    "id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "adicional_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "pago_id" INTEGER,
    "registrado_por_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumo_adicional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancelacion" (
    "id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "cancelada_por_id" INTEGER NOT NULL,
    "motivo" "MotivoCancelacion" NOT NULL,
    "detalle_motivo" TEXT,
    "adelanto_pagado" DECIMAL(10,2) NOT NULL,
    "resultado" "ResultadoCancelacion" NOT NULL,
    "importe_compensacion" DECIMAL(10,2) NOT NULL,
    "importe_retenido" DECIMAL(10,2) NOT NULL,
    "estado_compensacion" "EstadoCompensacion" NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancelacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devolucion" (
    "id" SERIAL NOT NULL,
    "cancelacion_id" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "numero_operacion" TEXT,
    "registrado_por_id" INTEGER NOT NULL,
    "cierre_caja_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devolucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credito" (
    "id" SERIAL NOT NULL,
    "jugador_id" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "saldo" DECIMAL(10,2) NOT NULL,
    "cancelacion_id" INTEGER,
    "habilitado_por_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credito_uso" (
    "id" SERIAL NOT NULL,
    "credito_id" INTEGER NOT NULL,
    "pago_id" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "credito_uso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reubicacion" (
    "id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "cancha_anterior_id" INTEGER NOT NULL,
    "cancha_nueva_id" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "registrado_por_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cierre_caja" (
    "id" SERIAL NOT NULL,
    "recepcionista_id" INTEGER NOT NULL,
    "cerrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totales" JSONB NOT NULL,
    "efectivo_esperado" DECIMAL(10,2) NOT NULL,
    "efectivo_contado" DECIMAL(10,2) NOT NULL,
    "diferencia" DECIMAL(10,2) NOT NULL,
    "resultado" "ResultadoCierre" NOT NULL,
    "observacion" TEXT,

    CONSTRAINT "cierre_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correccion_caja" (
    "id" SERIAL NOT NULL,
    "cierre_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "detalle" JSONB NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correccion_caja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE INDEX "usuario_rol_estado_idx" ON "usuario"("rol", "estado");

-- CreateIndex
CREATE INDEX "usuario_telefono_idx" ON "usuario"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_tipo_documento_numero_documento_key" ON "usuario"("tipo_documento", "numero_documento");

-- CreateIndex
CREATE UNIQUE INDEX "token_recuperacion_token_hash_key" ON "token_recuperacion"("token_hash");

-- CreateIndex
CREATE INDEX "token_recuperacion_usuario_id_idx" ON "token_recuperacion"("usuario_id");

-- CreateIndex
CREATE INDEX "registro_acceso_usuario_id_fecha_idx" ON "registro_acceso"("usuario_id", "fecha");

-- CreateIndex
CREATE INDEX "auditoria_fecha_idx" ON "auditoria"("fecha");

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_fecha_idx" ON "auditoria"("usuario_id", "fecha");

-- CreateIndex
CREATE INDEX "auditoria_accion_fecha_idx" ON "auditoria"("accion", "fecha");

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidad_id_idx" ON "auditoria"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "tarifa_cancha_id_franja_vigente_hasta_idx" ON "tarifa"("cancha_id", "franja", "vigente_hasta");

-- CreateIndex
CREATE INDEX "bloqueo_cancha_id_inicio_fin_idx" ON "bloqueo"("cancha_id", "inicio", "fin");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_codigo_key" ON "reserva"("codigo");

-- CreateIndex
CREATE INDEX "reserva_fecha_cancha_id_idx" ON "reserva"("fecha", "cancha_id");

-- CreateIndex
CREATE INDEX "reserva_jugador_id_estado_idx" ON "reserva"("jugador_id", "estado");

-- CreateIndex
CREATE INDEX "reserva_estado_vence_en_idx" ON "reserva"("estado", "vence_en");

-- CreateIndex
CREATE UNIQUE INDEX "pago_codigo_transaccion_key" ON "pago"("codigo_transaccion");

-- CreateIndex
CREATE INDEX "pago_reserva_id_concepto_estado_idx" ON "pago"("reserva_id", "concepto", "estado");

-- CreateIndex
CREATE INDEX "pago_registrado_por_id_cierre_caja_id_idx" ON "pago"("registrado_por_id", "cierre_caja_id");

-- CreateIndex
CREATE INDEX "consumo_adicional_reserva_id_idx" ON "consumo_adicional"("reserva_id");

-- CreateIndex
CREATE UNIQUE INDEX "cancelacion_reserva_id_key" ON "cancelacion"("reserva_id");

-- CreateIndex
CREATE INDEX "cancelacion_estado_compensacion_idx" ON "cancelacion"("estado_compensacion");

-- CreateIndex
CREATE INDEX "devolucion_registrado_por_id_cierre_caja_id_idx" ON "devolucion"("registrado_por_id", "cierre_caja_id");

-- CreateIndex
CREATE INDEX "credito_jugador_id_idx" ON "credito"("jugador_id");

-- CreateIndex
CREATE INDEX "credito_uso_credito_id_idx" ON "credito_uso"("credito_id");

-- CreateIndex
CREATE INDEX "credito_uso_pago_id_idx" ON "credito_uso"("pago_id");

-- CreateIndex
CREATE INDEX "reubicacion_reserva_id_idx" ON "reubicacion"("reserva_id");

-- CreateIndex
CREATE INDEX "cierre_caja_recepcionista_id_cerrado_en_idx" ON "cierre_caja"("recepcionista_id", "cerrado_en");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_recuperacion" ADD CONSTRAINT "token_recuperacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_acceso" ADD CONSTRAINT "registro_acceso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifa" ADD CONSTRAINT "tarifa_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "cancha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifa" ADD CONSTRAINT "tarifa_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueo" ADD CONSTRAINT "bloqueo_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "cancha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueo" ADD CONSTRAINT "bloqueo_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_jugador_id_fkey" FOREIGN KEY ("jugador_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "cancha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_validado_por_id_fkey" FOREIGN KEY ("validado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_cierre_caja_id_fkey" FOREIGN KEY ("cierre_caja_id") REFERENCES "cierre_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_adicional" ADD CONSTRAINT "consumo_adicional_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_adicional" ADD CONSTRAINT "consumo_adicional_adicional_id_fkey" FOREIGN KEY ("adicional_id") REFERENCES "adicional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_adicional" ADD CONSTRAINT "consumo_adicional_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_adicional" ADD CONSTRAINT "consumo_adicional_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelacion" ADD CONSTRAINT "cancelacion_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelacion" ADD CONSTRAINT "cancelacion_cancelada_por_id_fkey" FOREIGN KEY ("cancelada_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion" ADD CONSTRAINT "devolucion_cancelacion_id_fkey" FOREIGN KEY ("cancelacion_id") REFERENCES "cancelacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion" ADD CONSTRAINT "devolucion_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion" ADD CONSTRAINT "devolucion_cierre_caja_id_fkey" FOREIGN KEY ("cierre_caja_id") REFERENCES "cierre_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credito" ADD CONSTRAINT "credito_jugador_id_fkey" FOREIGN KEY ("jugador_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credito" ADD CONSTRAINT "credito_habilitado_por_id_fkey" FOREIGN KEY ("habilitado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credito" ADD CONSTRAINT "credito_cancelacion_id_fkey" FOREIGN KEY ("cancelacion_id") REFERENCES "cancelacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credito_uso" ADD CONSTRAINT "credito_uso_credito_id_fkey" FOREIGN KEY ("credito_id") REFERENCES "credito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credito_uso" ADD CONSTRAINT "credito_uso_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reubicacion" ADD CONSTRAINT "reubicacion_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reubicacion" ADD CONSTRAINT "reubicacion_cancha_anterior_id_fkey" FOREIGN KEY ("cancha_anterior_id") REFERENCES "cancha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reubicacion" ADD CONSTRAINT "reubicacion_cancha_nueva_id_fkey" FOREIGN KEY ("cancha_nueva_id") REFERENCES "cancha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reubicacion" ADD CONSTRAINT "reubicacion_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierre_caja" ADD CONSTRAINT "cierre_caja_recepcionista_id_fkey" FOREIGN KEY ("recepcionista_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correccion_caja" ADD CONSTRAINT "correccion_caja_cierre_id_fkey" FOREIGN KEY ("cierre_id") REFERENCES "cierre_caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correccion_caja" ADD CONSTRAINT "correccion_caja_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX cancha_nombre_unico ON cancha (lower(nombre));
CREATE UNIQUE INDEX adicional_nombre_unico ON adicional (lower(nombre));
CREATE UNIQUE INDEX tarifa_vigente_unica ON tarifa (cancha_id, franja) WHERE vigente_hasta IS NULL;

CREATE UNIQUE INDEX reserva_turno_unico ON reserva (cancha_id, fecha, hora_inicio)
  WHERE estado IN ('PENDIENTE_PAGO', 'PENDIENTE_VALIDACION', 'CONFIRMADA', 'EN_JUEGO', 'FINALIZADA');

CREATE UNIQUE INDEX pago_numero_operacion_unico ON pago (numero_operacion)
  WHERE numero_operacion IS NOT NULL AND estado IN ('APROBADO', 'PENDIENTE_VALIDACION');
CREATE UNIQUE INDEX pago_en_proceso_unico ON pago (reserva_id) WHERE estado = 'EN_PROCESO';

ALTER TABLE tarifa ADD CONSTRAINT tarifa_valor_positivo CHECK (valor > 0);
ALTER TABLE adicional ADD CONSTRAINT adicional_precio_positivo CHECK (precio > 0);
ALTER TABLE pago ADD CONSTRAINT pago_monto_positivo CHECK (monto > 0);
ALTER TABLE devolucion ADD CONSTRAINT devolucion_monto_positivo CHECK (monto > 0);
ALTER TABLE consumo_adicional ADD CONSTRAINT consumo_cantidad_positiva CHECK (cantidad > 0);
ALTER TABLE credito ADD CONSTRAINT credito_saldo_valido CHECK (saldo >= 0 AND saldo <= monto);
ALTER TABLE credito_uso ADD CONSTRAINT credito_uso_monto_positivo CHECK (monto > 0);
ALTER TABLE bloqueo ADD CONSTRAINT bloqueo_rango_valido CHECK (fin > inicio);
ALTER TABLE horario_dia ADD CONSTRAINT horario_dia_valido CHECK (dia_semana BETWEEN 1 AND 7);
ALTER TABLE regla_cancelacion ADD CONSTRAINT regla_horas_validas CHECK (horas_anticipacion >= 0);
ALTER TABLE configuracion ADD CONSTRAINT configuracion_tiempos_validos
  CHECK (tiempo_limite_pago_min > 0 AND minutos_antes_check_in >= 0 AND tolerancia_ausencia_min >= 0);
ALTER TABLE cierre_caja ADD CONSTRAINT cierre_efectivo_valido CHECK (efectivo_contado >= 0);
ALTER TABLE reserva ADD CONSTRAINT reserva_horario_valido CHECK (fin_en > inicio_en);

CREATE FUNCTION auditoria_inmutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La auditoria no se puede modificar ni eliminar';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auditoria_sin_cambios
  BEFORE UPDATE OR DELETE ON auditoria
  FOR EACH ROW EXECUTE FUNCTION auditoria_inmutable();
