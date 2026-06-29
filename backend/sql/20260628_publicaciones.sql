-- Modulo de publicaciones / feed de aprendizaje de Skill Swap
-- Ejecutar sobre la base de datos configurada en DB_NAME.

CREATE TABLE IF NOT EXISTS publicaciones (
  id_publicacion INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  tipo ENUM('OFREZCO','BUSCO','CONSULTA','RECURSO','LOGRO') NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  descripcion TEXT NOT NULL,
  nivel ENUM('PRINCIPIANTE','INTERMEDIO','AVANZADO') NULL,
  modalidad ENUM('VIRTUAL','PRESENCIAL','AMBAS') NULL,
  disponibilidad VARCHAR(255) NULL,
  estado ENUM('ACTIVA','OCULTA','ELIMINADA') NOT NULL DEFAULT 'ACTIVA',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_publicaciones_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  INDEX idx_publicaciones_feed (estado, fecha_creacion),
  INDEX idx_publicaciones_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publicacion_habilidad (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_publicacion INT UNSIGNED NOT NULL,
  id_habilidad INT NOT NULL,
  CONSTRAINT fk_ph_publicacion FOREIGN KEY (id_publicacion) REFERENCES publicaciones(id_publicacion) ON DELETE CASCADE,
  CONSTRAINT fk_ph_habilidad FOREIGN KEY (id_habilidad) REFERENCES habilidades(id_habilidad),
  UNIQUE KEY uq_publicacion_habilidad (id_publicacion, id_habilidad),
  INDEX idx_ph_habilidad (id_habilidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publicacion_archivos (
  id_archivo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_publicacion INT UNSIGNED NOT NULL,
  url_archivo VARCHAR(2048) NOT NULL,
  tipo ENUM('IMAGEN','CERTIFICADO','DOCUMENTO') NOT NULL,
  fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_archivos_publicacion FOREIGN KEY (id_publicacion) REFERENCES publicaciones(id_publicacion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comentarios (
  id_comentario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_publicacion INT UNSIGNED NOT NULL,
  id_usuario INT NOT NULL,
  comentario VARCHAR(1000) NOT NULL,
  fecha_comentario DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comentarios_publicacion FOREIGN KEY (id_publicacion) REFERENCES publicaciones(id_publicacion) ON DELETE CASCADE,
  CONSTRAINT fk_comentarios_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  INDEX idx_comentarios_publicacion (id_publicacion, fecha_comentario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reacciones (
  id_reaccion INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_publicacion INT UNSIGNED NOT NULL,
  id_usuario INT NOT NULL,
  tipo ENUM('LIKE','ME_INTERESA','APOYO') NOT NULL,
  fecha_reaccion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reacciones_publicacion FOREIGN KEY (id_publicacion) REFERENCES publicaciones(id_publicacion) ON DELETE CASCADE,
  CONSTRAINT fk_reacciones_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  UNIQUE KEY uq_reaccion_usuario (id_publicacion, id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publicaciones_guardadas (
  id_guardado INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_publicacion INT UNSIGNED NOT NULL,
  id_usuario INT NOT NULL,
  fecha_guardado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_guardados_publicacion FOREIGN KEY (id_publicacion) REFERENCES publicaciones(id_publicacion) ON DELETE CASCADE,
  CONSTRAINT fk_guardados_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  UNIQUE KEY uq_guardado_usuario (id_publicacion, id_usuario),
  INDEX idx_guardados_usuario (id_usuario, fecha_guardado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
