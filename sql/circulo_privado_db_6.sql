-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-04-2026 a las 04:52:26
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `circulo_privado_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alertas_emergencia`
--

CREATE TABLE `alertas_emergencia` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `status` varchar(40) DEFAULT 'enviada',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `accuracy_meters` decimal(10,2) DEFAULT NULL,
  `place_address` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `alertas_emergencia`
--

INSERT INTO `alertas_emergencia` (`id`, `user_id`, `latitude`, `longitude`, `status`, `created_at`, `accuracy_meters`, `place_address`) VALUES
(7, 19, 19.3921960, -99.7729305, 'enviada', '2026-04-01 06:37:22', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `avisos`
--

CREATE TABLE `avisos` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(180) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `pago_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `avisos`
--

INSERT INTO `avisos` (`id`, `user_id`, `title`, `content`, `categoria`, `prioridad`, `fijado`, `created_at`) VALUES
(5, 19, 'Suspensión temporal del servicio de agua', 'Se informa a todos los residentes que el servicio de agua será suspendido el día miércoles 10 de abril de 8:00 a.m. a 2:00 p.m. debido a trabajos de mantenimiento en la red principal.
Se recomienda tomar las precauciones necesarias.
Agradecemos su comprensión.', 'Mantenimiento', 'alta', 1, '2026-04-01 06:36:51'),
(6, 19, 'Suspensión temporal de acceso', 'Informamos a la comunidad que el acceso a la plataforma estará suspendido temporalmente por labores de mantenimiento el día de hoy de 10:00 p. m. a 11:30 p. m. Durante este periodo, algunos servicios podrían no estar disponibles. Agradecemos su comprensión.', 'Seguridad', 'alta', 1, '2026-04-04 07:36:28'),
(7, 19, 'Mantenimiento programado del sistema', 'Se informa a la comunidad que el sistema estará en mantenimiento el día de hoy de 10:00 p. m. a 11:30 p. m. Durante este periodo, el acceso a la plataforma estará restringido. Agradecemos su comprensión y paciencia.', 'Mantenimiento', 'normal', 0, '2026-04-04 07:59:58'),
(8, 19, 'Convivencia vecinal', 'Se invita a la comunidad a participar en la convivencia vecinal del próximo fin de semana en el parque central.', 'Evento', 'normal', 0, '2026-04-04 08:00:01'),
(9, 19, 'Recordatorio de seguridad', 'Se recuerda mantener cerradas las puertas de acceso y reportar cualquier situación sospechosa al personal correspondiente.', 'Seguridad', 'normal', 0, '2026-04-04 08:00:06');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carritos`
--

CREATE TABLE `carritos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('activo','comprado','cancelado') DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carrito_items`
--

CREATE TABLE `carrito_items` (
  `id` int(11) NOT NULL,
  `carrito_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras`
--

CREATE TABLE `compras` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `estado` enum('pendiente','pagada','cancelada') DEFAULT 'pendiente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `pago_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `compras`
--

INSERT INTO `compras` (`id`, `usuario_id`, `total`, `estado`, `created_at`) VALUES
(10, 22, 300.00, 'pagada', '2026-04-01 22:26:17');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compra_detalle`
--

CREATE TABLE `compra_detalle` (
  `id` int(11) NOT NULL,
  `compra_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `compra_detalle`
--

INSERT INTO `compra_detalle` (`id`, `compra_id`, `producto_id`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(10, 10, 3, 4, 75.00, 300.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones_email`
--

CREATE TABLE `notificaciones_email` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `tipo` varchar(50) NOT NULL,
  `referencia_id` int(11) DEFAULT NULL,
  `destinatario_email` varchar(255) NOT NULL,
  `asunto` varchar(255) NOT NULL,
  `estado` enum('pendiente','enviado','fallido') NOT NULL DEFAULT 'pendiente',
  `error_text` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sent_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupos`
--

CREATE TABLE `grupos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `creado_por` int(11) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupo_usuarios`
--

CREATE TABLE `grupo_usuarios` (
  `id` int(11) NOT NULL,
  `grupo_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `rol` enum('miembro','admin') DEFAULT 'miembro',
  `unido_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `incidentes`
--

CREATE TABLE `incidentes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(180) NOT NULL,
  `category` varchar(60) DEFAULT 'general',
  `description` text NOT NULL,
  `location_text` varchar(180) NOT NULL,
  `status` varchar(40) DEFAULT 'Pendiente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `accuracy_meters` decimal(10,2) DEFAULT NULL,
  `place_address` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `incidentes`
--

INSERT INTO `incidentes` (`id`, `user_id`, `title`, `category`, `description`, `location_text`, `status`, `created_at`, `latitude`, `longitude`, `accuracy_meters`, `place_address`) VALUES
(9, 19, 'Ruido excesivo en la noche', 'seguridad', 'Desde hace tres noches consecutivas se han presentado ruidos muy fuertes provenientes de una vivienda cercana, incluyendo música a alto volumen y gritos después de las 11:00 p.m. Esto está afectando el descanso de varios vecinos. Se solicita intervención para controlar la situación.', 'Calle principal, frente al parque central', 'Pendiente', '2026-04-01 06:35:54', NULL, NULL, NULL, NULL),
(10, 21, 'Persona sospechosa en la zona', 'seguridad', 'Se ha observado a un individuo desconocido merodeando las viviendas durante la noche. Ha estado revisando puertas y ventanas. Se solicita aumentar la vigilancia', 'Entrada principal del vecindario', 'Pendiente', '2026-04-01 08:10:25', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes_grupo`
--

CREATE TABLE `mensajes_grupo` (
  `id` int(11) NOT NULL,
  `grupo_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `mensaje` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mercado_vecinal`
--

CREATE TABLE `mercado_vecinal` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `precio` varchar(20) DEFAULT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `imagen` varchar(255) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'activo',
  `stock` int(11) NOT NULL DEFAULT 1,
  `estado_compra` enum('disponible','vendido','agotado') DEFAULT 'disponible'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mercado_vecinal`
--

INSERT INTO `mercado_vecinal` (`id`, `user_id`, `titulo`, `descripcion`, `precio`, `categoria`, `created_at`, `imagen`, `estado`, `stock`, `estado_compra`) VALUES
(3, 19, 'Fresas con crema caseras', 'Deliciosas fresas con crema preparadas al momento, con ingredientes frescos y de alta calidad. Perfectas para postre o antojo. Entregas en la zona.', '75', 'Venta', '2026-04-01 06:45:24', 'https://res.cloudinary.com/dcknftkjd/image/upload/v1775025923/circulo-privado/mercado/mcyto9own6lcn6xpbkcp.png', 'activo', 26, 'disponible'),
(4, 19, 'Renta de sillas para eventos', 'Se rentan sillas para todo tipo de eventos (fiestas, reuniones, cumpleaños). Material resistente y limpio. Entrega en la zona y precios accesibles según cantidad.', '100', 'Renta', '2026-04-01 18:56:56', 'https://res.cloudinary.com/dcknftkjd/image/upload/v1775069815/circulo-privado/mercado/xwbrpn8nwe0u5omb9kj6.webp', 'activo', 100, 'disponible'),
(5, 22, 'pastel ', 'venta de Pastel de chocolate ', '35', 'Venta', '2026-04-02 22:03:58', 'https://res.cloudinary.com/dcknftkjd/image/upload/v1775167438/circulo-privado/mercado/pzxdaruvlj0jx0uepxf0.png', 'activo', 15, 'disponible');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `concepto` varchar(150) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `estado` varchar(40) DEFAULT 'pendiente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `proveedor_pago` enum('mercadopago','paypal') DEFAULT NULL,
  `external_reference` varchar(100) DEFAULT NULL,
  `mp_preference_id` varchar(100) DEFAULT NULL,
  `mp_payment_id` varchar(100) DEFAULT NULL,
  `paypal_order_id` varchar(100) DEFAULT NULL,
  `paypal_capture_id` varchar(100) DEFAULT NULL,
  `pagado_en` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `usuario_id`, `concepto`, `monto`, `fecha_vencimiento`, `estado`, `created_at`, `proveedor_pago`, `external_reference`, `mp_preference_id`, `mp_payment_id`, `paypal_order_id`, `paypal_capture_id`, `pagado_en`) VALUES
(34, 19, 'Pago de mantenimiento mensual', 1500.00, '2026-04-30', 'pagado', '2026-04-01 07:02:16', 'paypal', '34', NULL, NULL, '3S691077RM995294Y', '0KA47738180894434', '2026-04-01 01:04:38'),
(35, 19, 'Pago del agua', 350.00, '2026-04-15', 'pendiente', '2026-04-01 18:53:59', 'paypal', '35', NULL, NULL, '1LN43272G2457105U', NULL, NULL),
(36, 22, 'Compra en Mercado Vecinal (1 producto(s))', 300.00, '2026-04-01', 'pagado', '2026-04-01 22:25:33', 'paypal', '36', NULL, NULL, '6VA887988K5789834', '2VD58669JM163640P', '2026-04-01 16:26:17');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'resident',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `telefono` varchar(20) DEFAULT NULL,
  `idioma` varchar(10) DEFAULT 'es',
  `tema` varchar(20) DEFAULT 'claro',
  `font_size` varchar(20) DEFAULT 'normal',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `street` varchar(120) DEFAULT NULL,
  `ext_number` varchar(20) DEFAULT NULL,
  `neighborhood` varchar(120) DEFAULT NULL,
  `city` varchar(120) DEFAULT NULL,
  `state` varchar(120) DEFAULT NULL,
  `postal_code` varchar(15) DEFAULT NULL,
  `country` varchar(80) DEFAULT 'México',
  `formatted_address` varchar(255) DEFAULT NULL,
  `home_latitude` decimal(10,7) DEFAULT NULL,
  `home_longitude` decimal(10,7) DEFAULT NULL,
  `last_latitude` decimal(10,7) DEFAULT NULL,
  `last_longitude` decimal(10,7) DEFAULT NULL,
  `last_accuracy_meters` decimal(10,2) DEFAULT NULL,
  `last_location_updated_at` datetime DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL,
  `foto_public_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `name`, `email`, `password`, `role`, `created_at`, `telefono`, `idioma`, `tema`, `font_size`, `activo`, `reset_token`, `reset_expires`, `street`, `ext_number`, `neighborhood`, `city`, `state`, `postal_code`, `country`, `formatted_address`, `home_latitude`, `home_longitude`, `last_latitude`, `last_longitude`, `last_accuracy_meters`, `last_location_updated_at`, `fecha_nacimiento`, `foto_perfil`, `foto_public_id`) VALUES
(19, 'Admin', 'Admin12@gmail.com', '$2b$10$bLTQvTGu8jEDFiQQLjoXYuhYTreOFIDwEfK3DxtpVSxPX8lyI9BoO', 'admin', '2026-04-01 06:30:21', NULL, 'es', 'claro', 'large', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'México', 'México', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'C:/Users/gafer/Downloads/Circulo_Privado_4/Circulo_Privado_4/Circulo_Privado 3/Backend/uploads/perfiles/perfil_1775179616956.jpg', NULL),
(21, 'Carlos Uriel', 'innovalabapp@gmail.com', '$2b$10$3el5aFRvYwZbrw9H3kvFJe2kOM5awi2vH.Z4HXF0jik.jYY9hNTyG', 'resident', '2026-04-01 08:07:01', NULL, 'es', 'claro', 'medium', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'México', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 'Carlos Uriel Sanchez Palma', 'sanchezpalmacarlosuriel@gmail.com', '$2b$10$mAOm.gmZA/5VHvhmCH2lPOFVAo0jYzTymzLCTuQ/FjodXkqFGw.v.', 'security', '2026-04-01 18:51:14', NULL, 'es', 'claro', 'large', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'México', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 'Eliza', 'garciafernandezyovanna@gmail.com', '$2b$10$6ATbageFEmDmtMN9uaUbv.4fvWmHpFGqIuNzuTx.KXLCI4i2I/.SC', 'resident', '2026-04-03 00:08:26', NULL, 'es', 'claro', 'medium', 1, NULL, NULL, 'laguna perdida', '105', 'nueva oxtotitlan', 'Toluca', 'Estado de Mexico', '50100', 'México', 'laguna perdida 105, nueva oxtotitlan, Toluca, Estado de Mexico, 50100, México', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 'yovanna gf', 'yovannagarciafernandez5@gmail.com', '$2b$10$1ScTskqVyaTR0PDmB2frAewVZ94KZjXyP7ZGNfiH90PtQckM89A/C', 'resident', '2026-04-03 00:53:05', NULL, 'es', 'claro', 'medium', 1, '9a18c0ca4599ebd5770a9de0183bb5e68353b465e29ac263094f7a25e67ab0a3', '2026-04-02 19:23:40', 'Laguna Pérdida', '105', 'Nueva Oxtotitlán', 'Toluca de Lerdo', 'Méx.', '50100', 'México', 'Laguna Pérdida 105, Nueva Oxtotitlán, Toluca de Lerdo, Méx., 50100, México', NULL, NULL, 19.2857345, -99.6837896, 109.00, '2026-04-02 18:54:53', NULL, 'https://res.cloudinary.com/dcknftkjd/image/upload/v1775184147/circulo-privado/mercado/ylhg8ibbcgu0oye5gext.jpg', 'circulo-privado/mercado/ylhg8ibbcgu0oye5gext');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alertas_emergencia`
--
ALTER TABLE `alertas_emergencia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `avisos`
--
ALTER TABLE `avisos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `carritos`
--
ALTER TABLE `carritos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `carrito_items`
--
ALTER TABLE `carrito_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `carrito_id` (`carrito_id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `compras`
--
ALTER TABLE `compras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `pago_id` (`pago_id`);

--
-- Indices de la tabla `compra_detalle`
--
ALTER TABLE `compra_detalle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `compra_id` (`compra_id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `notificaciones_email`
--
ALTER TABLE `notificaciones_email`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notificaciones_tipo_referencia` (`tipo`,`referencia_id`),
  ADD KEY `idx_notificaciones_usuario` (`usuario_id`);

-- --------------------------------------------------------

--
-- Indices de la tabla `grupos`
--
ALTER TABLE `grupos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `creado_por` (`creado_por`);

--
-- Indices de la tabla `grupo_usuarios`
--
ALTER TABLE `grupo_usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `grupo_id` (`grupo_id`,`usuario_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `incidentes`
--
ALTER TABLE `incidentes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `mensajes_grupo`
--
ALTER TABLE `mensajes_grupo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `grupo_id` (`grupo_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `mercado_vecinal`
--
ALTER TABLE `mercado_vecinal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alertas_emergencia`
--
ALTER TABLE `alertas_emergencia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `avisos`
--
ALTER TABLE `avisos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `carritos`
--
ALTER TABLE `carritos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `carrito_items`
--
ALTER TABLE `carrito_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `compras`
--
ALTER TABLE `compras`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `compra_detalle`
--
ALTER TABLE `compra_detalle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `notificaciones_email`
--
ALTER TABLE `notificaciones_email`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- AUTO_INCREMENT de la tabla `grupos`
--
ALTER TABLE `grupos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `grupo_usuarios`
--
ALTER TABLE `grupo_usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `incidentes`
--
ALTER TABLE `incidentes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `mensajes_grupo`
--
ALTER TABLE `mensajes_grupo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mercado_vecinal`
--
ALTER TABLE `mercado_vecinal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alertas_emergencia`
--
ALTER TABLE `alertas_emergencia`
  ADD CONSTRAINT `alertas_emergencia_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `avisos`
--
ALTER TABLE `avisos`
  ADD CONSTRAINT `avisos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `carritos`
--
ALTER TABLE `carritos`
  ADD CONSTRAINT `carritos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `carrito_items`
--
ALTER TABLE `carrito_items`
  ADD CONSTRAINT `carrito_items_ibfk_1` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`),
  ADD CONSTRAINT `carrito_items_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `mercado_vecinal` (`id`);

--
-- Filtros para la tabla `compras`
--
ALTER TABLE `compras`
  ADD CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `fk_compras_pago` FOREIGN KEY (`pago_id`) REFERENCES `pagos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `compra_detalle`
--
ALTER TABLE `compra_detalle`
  ADD CONSTRAINT `compra_detalle_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`),
  ADD CONSTRAINT `compra_detalle_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `mercado_vecinal` (`id`);

--
-- Filtros para la tabla `grupos`
--
ALTER TABLE `grupos`
  ADD CONSTRAINT `grupos_ibfk_1` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `notificaciones_email`
--
ALTER TABLE `notificaciones_email`
  ADD CONSTRAINT `fk_notificaciones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------

--
-- Filtros para la tabla `grupo_usuarios`
--
ALTER TABLE `grupo_usuarios`
  ADD CONSTRAINT `grupo_usuarios_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`),
  ADD CONSTRAINT `grupo_usuarios_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `incidentes`
--
ALTER TABLE `incidentes`
  ADD CONSTRAINT `incidentes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `mensajes_grupo`
--
ALTER TABLE `mensajes_grupo`
  ADD CONSTRAINT `mensajes_grupo_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`),
  ADD CONSTRAINT `mensajes_grupo_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `mercado_vecinal`
--
ALTER TABLE `mercado_vecinal`
  ADD CONSTRAINT `mercado_vecinal_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
