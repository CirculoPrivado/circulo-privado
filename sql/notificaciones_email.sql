ALTER TABLE compras
ADD COLUMN IF NOT EXISTS pago_id INT NULL AFTER estado;

ALTER TABLE compras
ADD CONSTRAINT fk_compras_pago
FOREIGN KEY (pago_id) REFERENCES pagos(id)
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS notificaciones_email (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  tipo VARCHAR(50) NOT NULL,
  referencia_id INT NULL,
  destinatario_email VARCHAR(255) NOT NULL,
  asunto VARCHAR(255) NOT NULL,
  estado ENUM('pendiente','enviado','fallido') NOT NULL DEFAULT 'pendiente',
  error_text TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  INDEX idx_notificaciones_tipo_referencia (tipo, referencia_id),
  INDEX idx_notificaciones_usuario (usuario_id),
  CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);
