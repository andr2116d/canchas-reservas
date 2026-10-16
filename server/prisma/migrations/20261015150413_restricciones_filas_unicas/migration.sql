ALTER TABLE regla_cancelacion ADD CONSTRAINT regla_fila_unica CHECK (id = 1);
ALTER TABLE configuracion ADD CONSTRAINT configuracion_fila_unica CHECK (id = 1);
ALTER TABLE reserva ADD CONSTRAINT reserva_regla_horas_validas CHECK (regla_horas_anticipacion >= 0);
