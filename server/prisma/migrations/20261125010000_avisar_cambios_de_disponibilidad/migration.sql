-- Cada escritura en lo que se ve en el mapa de turnos avisa por el canal «disponibilidad».
-- El server escucha el canal y avisa a los navegadores, que vuelven a pedir el mapa.
-- Un aviso por sentencia basta: el contenido es solo el nombre de la tabla.
CREATE FUNCTION avisar_cambio_de_disponibilidad() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify('disponibilidad', TG_TABLE_NAME);
  RETURN NULL;
END;
$$;

CREATE TRIGGER cancha_avisa_disponibilidad
  AFTER INSERT OR UPDATE OR DELETE ON "cancha"
  FOR EACH STATEMENT EXECUTE FUNCTION avisar_cambio_de_disponibilidad();

CREATE TRIGGER bloqueo_de_cancha_avisa_disponibilidad
  AFTER INSERT OR UPDATE OR DELETE ON "bloqueo_de_cancha"
  FOR EACH STATEMENT EXECUTE FUNCTION avisar_cambio_de_disponibilidad();

CREATE TRIGGER reserva_avisa_disponibilidad
  AFTER INSERT OR UPDATE OR DELETE ON "reserva"
  FOR EACH STATEMENT EXECUTE FUNCTION avisar_cambio_de_disponibilidad();

CREATE TRIGGER tarifa_de_cancha_avisa_disponibilidad
  AFTER INSERT OR UPDATE OR DELETE ON "tarifa_de_cancha"
  FOR EACH STATEMENT EXECUTE FUNCTION avisar_cambio_de_disponibilidad();

CREATE TRIGGER horario_de_atencion_avisa_disponibilidad
  AFTER INSERT OR UPDATE OR DELETE ON "horario_de_atencion"
  FOR EACH STATEMENT EXECUTE FUNCTION avisar_cambio_de_disponibilidad();

CREATE TRIGGER horario_del_dia_avisa_disponibilidad
  AFTER INSERT OR UPDATE OR DELETE ON "horario_del_dia"
  FOR EACH STATEMENT EXECUTE FUNCTION avisar_cambio_de_disponibilidad();

CREATE TRIGGER adelanto_minimo_avisa_disponibilidad
  AFTER INSERT OR UPDATE OR DELETE ON "adelanto_minimo"
  FOR EACH STATEMENT EXECUTE FUNCTION avisar_cambio_de_disponibilidad();
