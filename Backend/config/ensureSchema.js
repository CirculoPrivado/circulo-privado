const db = require("./db");

const statements = [

  `
    ALTER TABLE avisos
    ADD COLUMN IF NOT EXISTS categoria VARCHAR(60) NULL DEFAULT 'Aviso'
  `,
  `
    ALTER TABLE avisos
    ADD COLUMN IF NOT EXISTS fijado TINYINT(1) NOT NULL DEFAULT 0
  `,
  `
    ALTER TABLE avisos
    ADD COLUMN IF NOT EXISTS estado ENUM('activo','inactivo','archivado') DEFAULT 'activo'
  `,
  `
    ALTER TABLE avisos
    ADD COLUMN IF NOT EXISTS prioridad ENUM('baja','normal','alta') DEFAULT 'normal'
  `,
  `
    ALTER TABLE avisos
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
  `,
  `
    ALTER TABLE alertas_emergencia
    ADD COLUMN IF NOT EXISTS atendida_por INT NULL
  `,
  `
    ALTER TABLE alertas_emergencia
    ADD COLUMN IF NOT EXISTS atendida_at DATETIME NULL
  `,
  `
    ALTER TABLE alertas_emergencia
    ADD COLUMN IF NOT EXISTS comentarios TEXT NULL
  `,
  `
    ALTER TABLE alertas_emergencia
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
  `,
  `
    ALTER TABLE pagos
    ADD COLUMN IF NOT EXISTS proveedor_pago ENUM('mercadopago','paypal') NULL
  `,
  `
    ALTER TABLE pagos
    ADD COLUMN IF NOT EXISTS pagado_en DATETIME NULL
  `,
  `
    ALTER TABLE pagos
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
  `,
  `
    CREATE TABLE IF NOT EXISTS historial_incidentes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      incidente_id INT NOT NULL,
      usuario_id INT NULL,
      estado_anterior VARCHAR(40) NULL,
      estado_nuevo VARCHAR(40) NOT NULL,
      comentario TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_historial_incidente (incidente_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS historial_alertas_emergencia (
      id INT AUTO_INCREMENT PRIMARY KEY,
      alerta_id INT NOT NULL,
      usuario_id INT NULL,
      estado_anterior VARCHAR(40) NULL,
      estado_nuevo VARCHAR(40) NOT NULL,
      comentario TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_historial_alerta (alerta_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  `
    ALTER TABLE compras
    ADD COLUMN IF NOT EXISTS pago_id INT NULL
  `,
  `
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
    )
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS activo TINYINT(1) NOT NULL DEFAULT 1
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS reset_expires DATETIME NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS street VARCHAR(120) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS ext_number VARCHAR(20) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(120) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS city VARCHAR(120) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS state VARCHAR(120) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(15) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS country VARCHAR(80) NULL DEFAULT 'México'
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS formatted_address VARCHAR(255) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS home_latitude DECIMAL(10,7) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS home_longitude DECIMAL(10,7) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS last_latitude DECIMAL(10,7) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS last_longitude DECIMAL(10,7) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS last_accuracy_meters DECIMAL(10,2) NULL
  `,
  `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS last_location_updated_at DATETIME NULL
  `,
  `
    ALTER TABLE alertas_emergencia
    ADD COLUMN IF NOT EXISTS accuracy_meters DECIMAL(10,2) NULL
  `,
  `
    ALTER TABLE alertas_emergencia
    ADD COLUMN IF NOT EXISTS place_address VARCHAR(255) NULL
  `,
  `
    ALTER TABLE incidentes
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7) NULL
  `,
  `
    ALTER TABLE incidentes
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7) NULL
  `,
  `
    ALTER TABLE incidentes
    ADD COLUMN IF NOT EXISTS accuracy_meters DECIMAL(10,2) NULL
  `,
  `
    ALTER TABLE incidentes
    ADD COLUMN IF NOT EXISTS place_address VARCHAR(255) NULL
  `,
];

const ensureSchema = () => {
  statements.forEach((sql) => {
    db.query(sql, (alterErr) => {
      if (alterErr) {
        console.error("No se pudo validar el esquema:", alterErr.message);
      }
    });
  });

  db.query(
    "UPDATE usuarios SET activo = 1 WHERE activo IS NULL",
    (updateErr) => {
      if (updateErr) {
        console.error("No se pudo normalizar el estado activo:", updateErr.message);
      }
    }
  );

  db.query(
    "UPDATE usuarios SET country = 'México' WHERE country IS NULL OR country = ''",
    (updateErr) => {
      if (updateErr) {
        console.error("No se pudo normalizar country:", updateErr.message);
      }
    }
  );
};

module.exports = ensureSchema;
