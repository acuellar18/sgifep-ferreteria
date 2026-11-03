-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: sgifep_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_bak_bitacora_auditoria_utf8mb4`
--

DROP TABLE IF EXISTS `_bak_bitacora_auditoria_utf8mb4`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_bak_bitacora_auditoria_utf8mb4` (
  `id` bigint(20) NOT NULL DEFAULT 0,
  `usuario_id` int(11) DEFAULT NULL,
  `tabla` varchar(60) NOT NULL,
  `registro_id` bigint(20) DEFAULT NULL,
  `accion` enum('crear','actualizar','anular','eliminar') NOT NULL,
  `datos_anteriores` longtext DEFAULT NULL CHECK (json_valid(`datos_anteriores`)),
  `datos_nuevos` longtext DEFAULT NULL CHECK (json_valid(`datos_nuevos`)),
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_bak_bitacora_auditoria_utf8mb4`
--

LOCK TABLES `_bak_bitacora_auditoria_utf8mb4` WRITE;
/*!40000 ALTER TABLE `_bak_bitacora_auditoria_utf8mb4` DISABLE KEYS */;
INSERT INTO `_bak_bitacora_auditoria_utf8mb4` VALUES (1,NULL,'proveedores',1,'crear',NULL,'{\"id\": 1, \"nombre\": \"CELCO\", \"nit\": \"28912092\", \"activo\": 1}','2026-10-27 23:13:41'),(2,1,'compras',1,'crear',NULL,'{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"fecha\": \"2026-10-27\", \"total\": 1680.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-28 00:23:52'),(3,1,'compras',1,'actualizar','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-28 00:23:52'),(4,1,'pagos_compra',1,'crear',NULL,'{\"id\": 1, \"compra_id\": 1, \"fecha\": \"2026-10-27\", \"monto\": 1680.00, \"metodo\": \"efectivo\", \"referencia\": \"Pago automtico contado\", \"estado\": \"activo\", \"usuario_id\": 1}','2026-10-28 00:23:52'),(5,1,'compras',1,'actualizar','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-28 00:23:52');
/*!40000 ALTER TABLE `_bak_bitacora_auditoria_utf8mb4` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_bak_departamentos_utf8mb4`
--

DROP TABLE IF EXISTS `_bak_departamentos_utf8mb4`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_bak_departamentos_utf8mb4` (
  `id` int(11) NOT NULL DEFAULT 0,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_bak_departamentos_utf8mb4`
--

LOCK TABLES `_bak_departamentos_utf8mb4` WRITE;
/*!40000 ALTER TABLE `_bak_departamentos_utf8mb4` DISABLE KEYS */;
INSERT INTO `_bak_departamentos_utf8mb4` VALUES (1,'Ventas','Atenci??n y venta al cliente',1,'2026-10-25 16:50:53'),(2,'Bodega','Control de inventario y almac??n',1,'2026-10-25 16:50:53'),(3,'Caja','Cobros y facturaci??n',1,'2026-10-25 16:50:53'),(4,'Reparto','Despacho y entregas a domicilio',1,'2026-10-25 16:50:53'),(5,'Compras','Compras y abastecimiento',1,'2026-10-25 16:50:53'),(6,'Administraci??n','Gesti??n administrativa del sistema',1,'2026-10-25 16:50:53'),(7,'Secretaria','Secretaría y atención general',1,'2026-10-25 16:51:10'),(8,'Catedratico','Área docente / catedráticos',1,'2026-10-25 16:51:10'),(9,'Administracion','Administración general',1,'2026-10-25 16:51:10');
/*!40000 ALTER TABLE `_bak_departamentos_utf8mb4` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_bak_detalle_compra_reparacion`
--

DROP TABLE IF EXISTS `_bak_detalle_compra_reparacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_bak_detalle_compra_reparacion` (
  `id` int(11) NOT NULL DEFAULT 0,
  `compra_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` decimal(12,3) NOT NULL,
  `costo_unitario` decimal(14,4) NOT NULL,
  `precio_venta` decimal(14,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(14,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_bak_detalle_compra_reparacion`
--

LOCK TABLES `_bak_detalle_compra_reparacion` WRITE;
/*!40000 ALTER TABLE `_bak_detalle_compra_reparacion` DISABLE KEYS */;
INSERT INTO `_bak_detalle_compra_reparacion` VALUES (1,1,1,20.000,0.0000,150.00,0.00);
/*!40000 ALTER TABLE `_bak_detalle_compra_reparacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_bak_pagos_compra_utf8mb4`
--

DROP TABLE IF EXISTS `_bak_pagos_compra_utf8mb4`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_bak_pagos_compra_utf8mb4` (
  `id` int(11) NOT NULL DEFAULT 0,
  `compra_id` int(11) NOT NULL,
  `fecha` date NOT NULL DEFAULT curdate(),
  `monto` decimal(14,2) NOT NULL,
  `metodo` enum('efectivo','transferencia','cheque','otro') NOT NULL DEFAULT 'efectivo',
  `referencia` varchar(100) DEFAULT NULL,
  `notas` varchar(255) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `estado` enum('activo','anulado') NOT NULL DEFAULT 'activo',
  `anulado_en` timestamp NULL DEFAULT NULL,
  `anulado_por` int(11) DEFAULT NULL,
  `anulacion_motivo` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_bak_pagos_compra_utf8mb4`
--

LOCK TABLES `_bak_pagos_compra_utf8mb4` WRITE;
/*!40000 ALTER TABLE `_bak_pagos_compra_utf8mb4` DISABLE KEYS */;
INSERT INTO `_bak_pagos_compra_utf8mb4` VALUES (1,1,'2026-10-27',1680.00,'efectivo','Pago automtico contado','Compra al contado',1,'activo',NULL,NULL,NULL,'2026-10-28 00:23:52','2026-10-28 00:23:52');
/*!40000 ALTER TABLE `_bak_pagos_compra_utf8mb4` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_bak_roles_utf8mb4`
--

DROP TABLE IF EXISTS `_bak_roles_utf8mb4`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_bak_roles_utf8mb4` (
  `id` int(11) NOT NULL DEFAULT 0,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `acceso_total` tinyint(1) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `superadmin` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el rol permite acceso total (superadmin)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_bak_roles_utf8mb4`
--

LOCK TABLES `_bak_roles_utf8mb4` WRITE;
/*!40000 ALTER TABLE `_bak_roles_utf8mb4` DISABLE KEYS */;
INSERT INTO `_bak_roles_utf8mb4` VALUES (1,'administrador','Acceso total a todos los m??dulos del sistema',1,1,'2026-10-25 16:50:53',1),(2,'ventas','Acceso al m??dulo de ventas',0,1,'2026-10-25 16:50:53',0),(3,'bodega','Acceso al m??dulo de inventario',0,1,'2026-10-25 16:50:53',0),(4,'caja','Acceso a facturaci??n y cobros',0,1,'2026-10-25 16:50:53',0),(5,'reparto','Acceso a despachos',0,1,'2026-10-25 16:50:53',0),(6,'compras','Acceso a compras y abastecimiento',0,1,'2026-10-25 16:50:53',0);
/*!40000 ALTER TABLE `_bak_roles_utf8mb4` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_bak_usuarios_utf8mb4`
--

DROP TABLE IF EXISTS `_bak_usuarios_utf8mb4`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_bak_usuarios_utf8mb4` (
  `id` int(11) NOT NULL DEFAULT 0,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `codigo` varchar(30) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `foto_mime` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` varchar(30) NOT NULL DEFAULT 'ventas',
  `departamento_id` int(11) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_bak_usuarios_utf8mb4`
--

LOCK TABLES `_bak_usuarios_utf8mb4` WRITE;
/*!40000 ALTER TABLE `_bak_usuarios_utf8mb4` DISABLE KEYS */;
INSERT INTO `_bak_usuarios_utf8mb4` VALUES (1,'Administrador','anthony1131cuellar@gmail.com','','ADM-001','admin',NULL,NULL,NULL,'$2a$10$68O.HrcpOiYXpImi40bZreOj90UlIA/Upcjy9lCPCUM8Do0cpG2fq','admin',NULL,1,'2026-10-25 16:51:10','2026-10-28 01:22:20');
/*!40000 ALTER TABLE `_bak_usuarios_utf8mb4` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditoria_eventos`
--

DROP TABLE IF EXISTS `auditoria_eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auditoria_eventos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `accion` varchar(80) NOT NULL,
  `entidad` varchar(60) DEFAULT NULL,
  `entidad_id` varchar(60) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `datos` longtext DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_auditoria_fecha` (`creado_en`),
  KEY `idx_auditoria_usuario` (`usuario_id`),
  KEY `idx_auditoria_accion` (`accion`),
  KEY `idx_auditoria_entidad` (`entidad`,`entidad_id`),
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria_eventos`
--

LOCK TABLES `auditoria_eventos` WRITE;
/*!40000 ALTER TABLE `auditoria_eventos` DISABLE KEYS */;
INSERT INTO `auditoria_eventos` VALUES (1,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-27 20:25:02'),(2,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-28 01:09:34'),(3,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-28 01:41:45'),(4,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-28 15:42:42'),(5,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-30 21:12:42'),(6,NULL,'x','auth.login.fallido','usuarios',NULL,'Intento de inicio de sesión con usuario inexistente',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-GT) WindowsPowerShell/5.1.22621.6133','2026-10-30 21:54:26'),(7,NULL,'x','auth.login.fallido','usuarios',NULL,'Intento de inicio de sesión con usuario inexistente',NULL,'::ffff:127.0.0.1','curl/8.13.0','2026-10-30 21:54:43');
/*!40000 ALTER TABLE `auditoria_eventos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitacora_auditoria`
--

DROP TABLE IF EXISTS `bitacora_auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bitacora_auditoria` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `tabla` varchar(60) NOT NULL,
  `registro_id` bigint(20) DEFAULT NULL,
  `accion` enum('crear','actualizar','anular','eliminar') NOT NULL,
  `datos_anteriores` longtext DEFAULT NULL CHECK (json_valid(`datos_anteriores`)),
  `datos_nuevos` longtext DEFAULT NULL CHECK (json_valid(`datos_nuevos`)),
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_bitacora_tabla_registro` (`tabla`,`registro_id`),
  KEY `idx_bitacora_fecha` (`creado_en`),
  KEY `idx_bitacora_usuario` (`usuario_id`),
  CONSTRAINT `fk_bitacora_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora_auditoria`
--

LOCK TABLES `bitacora_auditoria` WRITE;
/*!40000 ALTER TABLE `bitacora_auditoria` DISABLE KEYS */;
INSERT INTO `bitacora_auditoria` VALUES (1,NULL,'proveedores',1,'crear',NULL,'{\"id\": 1, \"nombre\": \"CELCO\", \"nit\": \"28912092\", \"activo\": 1}','2026-10-27 23:13:41'),(2,1,'compras',1,'crear',NULL,'{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"fecha\": \"2026-10-27\", \"total\": 1680.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-28 00:23:52'),(3,1,'compras',1,'actualizar','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-28 00:23:52'),(4,1,'pagos_compra',1,'crear',NULL,'{\"id\": 1, \"compra_id\": 1, \"fecha\": \"2026-10-27\", \"monto\": 1680.00, \"metodo\": \"efectivo\", \"referencia\": \"Pago automático contado\", \"estado\": \"activo\", \"usuario_id\": 1}','2026-10-28 00:23:52'),(5,1,'compras',1,'actualizar','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-28 00:23:52'),(14,1,'compras',1,'actualizar','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-30 21:48:16'),(15,1,'pagos_compra',1,'actualizar','{\"id\": 1, \"compra_id\": 1, \"fecha\": \"2026-10-27\", \"monto\": 1680.00, \"metodo\": \"efectivo\", \"referencia\": \"Pago automático contado\", \"estado\": \"activo\", \"anulacion_motivo\": null}','{\"id\": 1, \"compra_id\": 1, \"fecha\": \"2026-10-27\", \"monto\": 1680.00, \"metodo\": \"efectivo\", \"referencia\": \"Pago automático contado\", \"estado\": \"activo\", \"anulacion_motivo\": null}','2026-10-30 21:48:16');
/*!40000 ALTER TABLE `bitacora_auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categorias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Cemento y Concreto','Cemento, concreto, mortero y aditivos',1,'2026-10-25 16:51:01'),(2,'Tubería y Conexiones','Tuberías PVC, cobre, galvanizado y sus conexiones',1,'2026-10-25 16:51:01'),(3,'Pinturas y Recubrimientos','Pinturas, esmaltes, selladores, impermeabilizantes',1,'2026-10-25 16:51:01'),(4,'Herramientas Manuales','Martillos, llaves, alicates, destornilladores, sierras',1,'2026-10-25 16:51:01'),(5,'Herramientas Eléctricas','Taladros, sierras eléctricas, amoladoras, pulidoras',1,'2026-10-25 16:51:01'),(6,'Material Eléctrico','Cables, interruptores, tomacorrientes, breakers, tableros',1,'2026-10-25 16:51:01'),(7,'Cerrajería y Seguridad','Cerraduras, candados, bisagras, pestillos, alarmas',1,'2026-10-25 16:51:01'),(8,'Tornillería y Fijación','Tornillos, clavos, tarugos, anclajes, pernos',1,'2026-10-25 16:51:01'),(9,'Plomería y Sanitarios','Llaves de paso, válvulas, sanitarios, grifería',1,'2026-10-25 16:51:01'),(10,'Ferretería General','Productos varios de ferretería',1,'2026-10-25 16:51:01');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nit` varchar(20) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `dias_credito` int(11) NOT NULL DEFAULT 0,
  `limite_credito` decimal(12,2) NOT NULL DEFAULT 0.00,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nit` (`nit`),
  KEY `idx_clientes_nombre` (`nombre`),
  KEY `idx_clientes_estado` (`estado`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'CF','Consumidor Final',NULL,NULL,NULL,0,0.00,'activo','2026-10-25 16:51:02');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cobros`
--

DROP TABLE IF EXISTS `cobros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cobros` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `venta_id` bigint(20) DEFAULT NULL,
  `factura_id` bigint(20) DEFAULT NULL,
  `cliente_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `caja_id` bigint(20) DEFAULT NULL,
  `metodo_pago` enum('efectivo','tarjeta','transferencia') NOT NULL,
  `monto` decimal(14,2) NOT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `notas` varchar(255) DEFAULT NULL,
  `estado` enum('registrado','anulado') NOT NULL DEFAULT 'registrado',
  `anulada_en` timestamp NULL DEFAULT NULL,
  `anulacion_motivo` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_cobros_cliente` (`cliente_id`),
  KEY `fk_cobros_usuario` (`usuario_id`),
  KEY `idx_cobros_venta` (`venta_id`),
  KEY `idx_cobros_factura` (`factura_id`),
  KEY `idx_cobros_creado` (`creado_en`),
  KEY `idx_cobros_caja_fecha` (`caja_id`,`creado_en`),
  KEY `idx_cobros_factura_estado` (`factura_id`,`estado`),
  CONSTRAINT `fk_cobros_caja` FOREIGN KEY (`caja_id`) REFERENCES `sesiones_caja` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cobros_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `fk_cobros_factura` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cobros_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_cobros_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_cobros_monto` CHECK (`monto` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cobros`
--

LOCK TABLES `cobros` WRITE;
/*!40000 ALTER TABLE `cobros` DISABLE KEYS */;
/*!40000 ALTER TABLE `cobros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compra_archivos`
--

DROP TABLE IF EXISTS `compra_archivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compra_archivos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `compra_id` int(11) NOT NULL,
  `nombre_original` varchar(255) NOT NULL,
  `nombre_guardado` varchar(255) NOT NULL,
  `mime` varchar(100) NOT NULL,
  `tamano` int(10) unsigned NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_archivo_usuario` (`usuario_id`),
  KEY `idx_archivos_compra` (`compra_id`,`creado_en`),
  CONSTRAINT `fk_archivo_compra` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_archivo_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compra_archivos`
--

LOCK TABLES `compra_archivos` WRITE;
/*!40000 ALTER TABLE `compra_archivos` DISABLE KEYS */;
/*!40000 ALTER TABLE `compra_archivos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compra_comentarios`
--

DROP TABLE IF EXISTS `compra_comentarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compra_comentarios` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `compra_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `comentario` text NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_comentario_usuario` (`usuario_id`),
  KEY `idx_comentarios_compra` (`compra_id`,`creado_en`),
  CONSTRAINT `fk_comentario_compra` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comentario_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compra_comentarios`
--

LOCK TABLES `compra_comentarios` WRITE;
/*!40000 ALTER TABLE `compra_comentarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `compra_comentarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compras` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) NOT NULL,
  `proveedor_id` int(11) NOT NULL,
  `fecha` date NOT NULL DEFAULT curdate(),
  `numero_factura` varchar(50) DEFAULT NULL,
  `serie` varchar(20) DEFAULT NULL,
  `condicion` enum('contado','credito') NOT NULL DEFAULT 'contado',
  `fecha_vencimiento` date DEFAULT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `iva` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `monto_pagado` decimal(14,2) NOT NULL DEFAULT 0.00,
  `saldo_pendiente` decimal(14,2) NOT NULL DEFAULT 0.00,
  `estado_pago` enum('pendiente','parcial','pagada') NOT NULL DEFAULT 'pendiente',
  `estado` enum('recibida','anulada') NOT NULL DEFAULT 'recibida',
  `orden_compra_id` int(11) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `adjunto_factura` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `anulada_en` timestamp NULL DEFAULT NULL,
  `anulada_por` int(11) DEFAULT NULL,
  `anulacion_motivo` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `fk_compras_orden` (`orden_compra_id`),
  KEY `fk_compras_usuario` (`usuario_id`),
  KEY `fk_compras_anulada_por` (`anulada_por`),
  KEY `idx_compras_numero` (`numero`),
  KEY `idx_compras_proveedor` (`proveedor_id`),
  KEY `idx_compras_fecha` (`fecha`),
  KEY `idx_compras_factura` (`numero_factura`,`proveedor_id`),
  KEY `idx_compras_estado_pago` (`estado_pago`),
  KEY `idx_compras_estado` (`estado`),
  KEY `idx_compras_vencimiento` (`fecha_vencimiento`),
  KEY `idx_compras_serie_factura` (`serie`,`numero_factura`),
  CONSTRAINT `fk_compras_anulada_por` FOREIGN KEY (`anulada_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_compras_orden` FOREIGN KEY (`orden_compra_id`) REFERENCES `ordenes_compra` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_compras_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`),
  CONSTRAINT `fk_compras_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
INSERT INTO `compras` VALUES (1,'C-2026-000001',1,'2026-10-27',NULL,NULL,'contado',NULL,1500.00,180.00,1680.00,1680.00,0.00,'pagada','recibida',NULL,NULL,1,NULL,'2026-10-28 00:23:52','2026-10-30 21:48:16',NULL,NULL,NULL);
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_compras_after_insert
AFTER INSERT ON compras
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id), 'compras', NEW.id, 'crear', NULL,
             JSON_OBJECT(
                'id', NEW.id,
                'numero', NEW.numero,
                'proveedor_id', NEW.proveedor_id,
                'fecha', NEW.fecha,
                'total', NEW.total,
                'estado', NEW.estado,
                'estado_pago', NEW.estado_pago
             ));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_compras_before_update
BEFORE UPDATE ON compras
FOR EACH ROW
BEGIN
    DECLARE v_pagos_activos INT;

    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        IF OLD.estado = 'anulada' AND NEW.estado <> 'anulada' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede reactivar una compra anulada';
        END IF;

        IF NEW.estado = 'anulada' AND OLD.estado <> 'anulada' THEN
            IF NEW.anulacion_motivo IS NULL OR TRIM(NEW.anulacion_motivo) = '' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El motivo de anulación de la compra es requerido';
            END IF;
            IF NEW.anulada_por IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario que anula la compra es requerido';
            END IF;

            SELECT COUNT(*) INTO v_pagos_activos
            FROM pagos_compra
            WHERE compra_id = NEW.id AND estado = 'activo';

            IF v_pagos_activos > 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede anular una compra con pagos activos';
            END IF;

            SET NEW.monto_pagado = 0;
            SET NEW.saldo_pendiente = 0;
            SET NEW.estado_pago = 'pagada';
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_compras_after_update
AFTER UPDATE ON compras
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id, OLD.usuario_id), 'compras', NEW.id,
             IF(NEW.estado = 'anulada' AND OLD.estado <> 'anulada', 'anular', 'actualizar'),
             JSON_OBJECT(
                'id', OLD.id,
                'numero', OLD.numero,
                'proveedor_id', OLD.proveedor_id,
                'total', OLD.total,
                'monto_pagado', OLD.monto_pagado,
                'saldo_pendiente', OLD.saldo_pendiente,
                'estado', OLD.estado,
                'estado_pago', OLD.estado_pago
             ),
             JSON_OBJECT(
                'id', NEW.id,
                'numero', NEW.numero,
                'proveedor_id', NEW.proveedor_id,
                'total', NEW.total,
                'monto_pagado', NEW.monto_pagado,
                'saldo_pendiente', NEW.saldo_pendiente,
                'estado', NEW.estado,
                'estado_pago', NEW.estado_pago
             ));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_compras_before_delete
BEFORE DELETE ON compras
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se permite eliminar compras; use la anulación';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_compras_after_delete
AFTER DELETE ON compras
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, OLD.usuario_id), 'compras', OLD.id, 'eliminar',
             JSON_OBJECT('id', OLD.id, 'numero', OLD.numero, 'total', OLD.total),
             NULL);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `configuracion_empresa`
--

DROP TABLE IF EXISTS `configuracion_empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `configuracion_empresa` (
  `id` tinyint(3) unsigned NOT NULL DEFAULT 1,
  `nombre` varchar(150) NOT NULL,
  `nit` varchar(20) DEFAULT NULL,
  `direccion` varchar(300) DEFAULT NULL,
  `telefono` varchar(40) DEFAULT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `logo_url` varchar(300) DEFAULT NULL,
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_config_empresa_unica` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_empresa`
--

LOCK TABLES `configuracion_empresa` WRITE;
/*!40000 ALTER TABLE `configuracion_empresa` DISABLE KEYS */;
INSERT INTO `configuracion_empresa` VALUES (1,'Ferretería El Puente',NULL,NULL,NULL,NULL,'/img/logo.png','2026-10-25 16:51:02');
/*!40000 ALTER TABLE `configuracion_empresa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departamentos`
--

DROP TABLE IF EXISTS `departamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departamentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamentos`
--

LOCK TABLES `departamentos` WRITE;
/*!40000 ALTER TABLE `departamentos` DISABLE KEYS */;
INSERT INTO `departamentos` VALUES (1,'Ventas','Atención y venta al cliente',1,'2026-10-25 16:50:53'),(2,'Bodega','Control de inventario y almacén',1,'2026-10-25 16:50:53'),(3,'Caja','Cobros y facturación',1,'2026-10-25 16:50:53'),(4,'Reparto','Despacho y entregas a domicilio',1,'2026-10-25 16:50:53'),(5,'Compras','Compras y abastecimiento',1,'2026-10-25 16:50:53'),(6,'Administración','Gestión administrativa del sistema',1,'2026-10-25 16:50:53'),(7,'Secretaría','Secretaría y atención general',1,'2026-10-25 16:51:10'),(8,'Catedrático','Área docente / catedráticos',1,'2026-10-25 16:51:10');
/*!40000 ALTER TABLE `departamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_compra`
--

DROP TABLE IF EXISTS `detalle_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_compra` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `compra_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` decimal(12,3) NOT NULL,
  `costo_unitario` decimal(14,4) NOT NULL,
  `precio_venta` decimal(14,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(14,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_detalle_compra_compra` (`compra_id`),
  KEY `idx_detalle_compra_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_compra_compra` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_compra_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_compra`
--

LOCK TABLES `detalle_compra` WRITE;
/*!40000 ALTER TABLE `detalle_compra` DISABLE KEYS */;
INSERT INTO `detalle_compra` VALUES (1,1,1,20.000,75.0000,150.00,1500.00);
/*!40000 ALTER TABLE `detalle_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_devolucion_venta`
--

DROP TABLE IF EXISTS `detalle_devolucion_venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_devolucion_venta` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `devolucion_id` bigint(20) NOT NULL,
  `detalle_venta_id` bigint(20) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `producto_codigo` varchar(30) NOT NULL,
  `producto_nombre` varchar(150) NOT NULL,
  `tipo` enum('producto','servicio') NOT NULL DEFAULT 'producto',
  `cantidad` decimal(12,3) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `descuento` decimal(14,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(14,2) NOT NULL,
  `costo_unitario` decimal(12,4) NOT NULL DEFAULT 0.0000,
  PRIMARY KEY (`id`),
  KEY `idx_detalle_devolucion_devolucion` (`devolucion_id`),
  KEY `idx_detalle_devolucion_detalle` (`detalle_venta_id`),
  KEY `idx_detalle_devolucion_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_devolucion_detalle` FOREIGN KEY (`detalle_venta_id`) REFERENCES `detalle_venta` (`id`),
  CONSTRAINT `fk_detalle_devolucion_devolucion` FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones_venta` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_devolucion_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `chk_detalle_devolucion_cantidad` CHECK (`cantidad` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_devolucion_venta`
--

LOCK TABLES `detalle_devolucion_venta` WRITE;
/*!40000 ALTER TABLE `detalle_devolucion_venta` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_devolucion_venta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_factura`
--

DROP TABLE IF EXISTS `detalle_factura`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_factura` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `factura_id` bigint(20) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `producto_codigo` varchar(30) NOT NULL,
  `producto_nombre` varchar(150) NOT NULL,
  `unidad_medida` varchar(10) NOT NULL DEFAULT 'UNI',
  `tipo` enum('producto','servicio') NOT NULL DEFAULT 'producto',
  `cantidad` decimal(12,3) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `costo_unitario` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `subtotal` decimal(14,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_detalle_factura_factura` (`factura_id`),
  KEY `idx_detalle_factura_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_factura_factura` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_factura_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `chk_detalle_factura_cantidad` CHECK (`cantidad` > 0),
  CONSTRAINT `chk_detalle_factura_precio` CHECK (`precio_unitario` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_factura`
--

LOCK TABLES `detalle_factura` WRITE;
/*!40000 ALTER TABLE `detalle_factura` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_factura` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_orden_compra`
--

DROP TABLE IF EXISTS `detalle_orden_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_orden_compra` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orden_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad_solicitada` decimal(12,3) NOT NULL,
  `cantidad_recibida` decimal(12,3) NOT NULL DEFAULT 0.000,
  `costo_estimado` decimal(14,4) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_detalle_orden_orden` (`orden_id`),
  KEY `idx_detalle_orden_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_orden_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_compra` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_orden_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_orden_compra`
--

LOCK TABLES `detalle_orden_compra` WRITE;
/*!40000 ALTER TABLE `detalle_orden_compra` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_orden_compra` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_detalle_orden_after_insert
AFTER INSERT ON detalle_orden_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        CALL sp_recalcular_totales_orden(NEW.orden_id);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_detalle_orden_after_update
AFTER UPDATE ON detalle_orden_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        IF NEW.orden_id <> OLD.orden_id THEN
            CALL sp_recalcular_totales_orden(OLD.orden_id);
        END IF;
        CALL sp_recalcular_totales_orden(NEW.orden_id);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_detalle_orden_after_delete
AFTER DELETE ON detalle_orden_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        CALL sp_recalcular_totales_orden(OLD.orden_id);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `detalle_venta`
--

DROP TABLE IF EXISTS `detalle_venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_venta` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `venta_id` bigint(20) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `producto_codigo` varchar(30) NOT NULL,
  `producto_nombre` varchar(150) NOT NULL,
  `presentacion` varchar(100) DEFAULT NULL,
  `unidad_medida` varchar(10) NOT NULL DEFAULT 'UNI',
  `tipo` enum('producto','servicio') NOT NULL DEFAULT 'producto',
  `cantidad` decimal(12,3) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `descuento` decimal(14,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(14,2) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_detalle_venta_venta` (`venta_id`),
  KEY `idx_detalle_venta_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_venta_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `fk_detalle_venta_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_detalle_venta_cantidad` CHECK (`cantidad` > 0),
  CONSTRAINT `chk_detalle_venta_precio` CHECK (`precio_unitario` >= 0),
  CONSTRAINT `chk_detalle_venta_descuento` CHECK (`descuento` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_venta`
--

LOCK TABLES `detalle_venta` WRITE;
/*!40000 ALTER TABLE `detalle_venta` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_venta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devoluciones_venta`
--

DROP TABLE IF EXISTS `devoluciones_venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `devoluciones_venta` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `numero` varchar(30) NOT NULL,
  `venta_id` bigint(20) NOT NULL,
  `factura_id` bigint(20) DEFAULT NULL,
  `cliente_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `caja_id` bigint(20) DEFAULT NULL,
  `tipo` enum('reembolso','nota_credito') NOT NULL DEFAULT 'reembolso',
  `metodo_pago` enum('efectivo','tarjeta','transferencia','credito') NOT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `iva` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `motivo` varchar(255) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `fk_devoluciones_venta_factura` (`factura_id`),
  KEY `fk_devoluciones_venta_cliente` (`cliente_id`),
  KEY `fk_devoluciones_venta_usuario` (`usuario_id`),
  KEY `idx_devoluciones_venta_venta` (`venta_id`),
  KEY `idx_devoluciones_venta_fecha` (`creado_en`),
  KEY `idx_devoluciones_venta_caja` (`caja_id`),
  CONSTRAINT `fk_devoluciones_venta_caja` FOREIGN KEY (`caja_id`) REFERENCES `sesiones_caja` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_devoluciones_venta_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `fk_devoluciones_venta_factura` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_devoluciones_venta_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_devoluciones_venta_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devoluciones_venta`
--

LOCK TABLES `devoluciones_venta` WRITE;
/*!40000 ALTER TABLE `devoluciones_venta` DISABLE KEYS */;
/*!40000 ALTER TABLE `devoluciones_venta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `facturas` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `numero` varchar(30) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `cliente_nombre` varchar(150) NOT NULL,
  `cliente_nit` varchar(20) NOT NULL,
  `cliente_telefono` varchar(30) DEFAULT NULL,
  `cliente_correo` varchar(150) DEFAULT NULL,
  `cliente_direccion` varchar(255) DEFAULT NULL,
  `fecha` date NOT NULL,
  `condicion` enum('contado','credito') NOT NULL DEFAULT 'contado',
  `fecha_vencimiento` date DEFAULT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `iva` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `monto_pagado` decimal(14,2) NOT NULL DEFAULT 0.00,
  `saldo_pendiente` decimal(14,2) NOT NULL DEFAULT 0.00,
  `estado` enum('emitida','anulada') NOT NULL DEFAULT 'emitida',
  `estado_pago` enum('pendiente','parcial','pagada') NOT NULL DEFAULT 'pendiente',
  `notas` varchar(500) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `anulada_en` timestamp NULL DEFAULT NULL,
  `anulada_por` int(11) DEFAULT NULL,
  `anulacion_motivo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `fk_facturas_usuario` (`usuario_id`),
  KEY `fk_facturas_anulada_por` (`anulada_por`),
  KEY `idx_facturas_cliente_fecha` (`cliente_id`,`fecha`),
  KEY `idx_facturas_fecha` (`fecha`),
  KEY `idx_facturas_estado` (`estado`),
  KEY `idx_facturas_estado_pago` (`estado_pago`),
  CONSTRAINT `fk_facturas_anulada_por` FOREIGN KEY (`anulada_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_facturas_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `fk_facturas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intentos_login`
--

DROP TABLE IF EXISTS `intentos_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `intentos_login` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `exito` tinyint(1) NOT NULL DEFAULT 0,
  `motivo` varchar(120) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_intentos_login_fecha` (`creado_en`),
  KEY `idx_intentos_login_usuario_ip` (`username`,`ip`,`creado_en`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intentos_login`
--

LOCK TABLES `intentos_login` WRITE;
/*!40000 ALTER TABLE `intentos_login` DISABLE KEYS */;
INSERT INTO `intentos_login` VALUES (1,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-27 20:25:02'),(2,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-28 01:09:34'),(3,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-28 01:41:45'),(4,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-28 15:42:42'),(5,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-30 21:12:42'),(6,'x','::ffff:127.0.0.1',0,'usuario_inexistente','2026-10-30 21:54:26'),(7,'x','::ffff:127.0.0.1',0,'usuario_inexistente','2026-10-30 21:54:43');
/*!40000 ALTER TABLE `intentos_login` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_inventario`
--

DROP TABLE IF EXISTS `movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimientos_inventario` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `producto_id` int(11) NOT NULL,
  `tipo` enum('entrada','salida','ajuste') NOT NULL,
  `origen` enum('compra','anulacion_compra','ajuste_manual','ajuste_positivo','ajuste_negativo','inventario_inicial','venta','anulacion_venta','devolucion_venta','otro') NOT NULL DEFAULT 'otro',
  `referencia_tipo` varchar(30) DEFAULT NULL,
  `referencia_id` int(11) DEFAULT NULL,
  `cantidad` decimal(12,3) NOT NULL,
  `stock_anterior` decimal(12,3) DEFAULT NULL,
  `stock_nuevo` decimal(12,3) DEFAULT NULL,
  `saldo_resultante` decimal(12,3) DEFAULT NULL,
  `costo_unitario` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `notas` varchar(255) DEFAULT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `referencia` varchar(120) DEFAULT NULL,
  `observaciones` varchar(500) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mov_producto_fecha` (`producto_id`,`creado_en`),
  KEY `idx_mov_referencia` (`referencia_tipo`,`referencia_id`),
  KEY `idx_mov_origen` (`origen`),
  KEY `idx_mov_usuario` (`usuario_id`),
  KEY `idx_mov_producto_saldo` (`producto_id`,`saldo_resultante`),
  KEY `idx_mov_fecha` (`creado_en`),
  KEY `idx_mov_tipo` (`tipo`),
  CONSTRAINT `fk_mov_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_mov_cantidad` CHECK (`cantidad` > 0),
  CONSTRAINT `chk_mov_saldo_no_negativo` CHECK (`saldo_resultante` is null or `saldo_resultante` >= 0),
  CONSTRAINT `chk_mov_stock_anterior_no_negativo` CHECK (`stock_anterior` is null or `stock_anterior` >= 0),
  CONSTRAINT `chk_mov_stock_nuevo_no_negativo` CHECK (`stock_nuevo` is null or `stock_nuevo` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES (1,1,'entrada','compra','compras',1,20.000,0.000,20.000,20.000,75.0000,'Entrada por compra C-2026-000001','Entrada por compra C-2026-000001',NULL,NULL,1,'2026-10-28 00:23:52');
/*!40000 ALTER TABLE `movimientos_inventario` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_movimientos_before_insert
BEFORE INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
    DECLARE v_tipo_producto VARCHAR(20);
    DECLARE v_stock DECIMAL(12,3);
    DECLARE v_promedio DECIMAL(12,4);
    DECLARE v_costo_ultimo DECIMAL(12,4);
    DECLARE v_nuevo_stock DECIMAL(12,3);
    DECLARE v_nuevo_promedio DECIMAL(12,4);
    DECLARE v_nuevo_costo_ultimo DECIMAL(12,4);

    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SELECT tipo, stock_actual, costo_promedio, costo_ultimo
        INTO v_tipo_producto, v_stock, v_promedio, v_costo_ultimo
        FROM productos
        WHERE id = NEW.producto_id
        FOR UPDATE;

        IF v_stock IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto del movimiento no existe';
        END IF;
        IF v_tipo_producto = 'servicio' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los servicios no controlan existencias';
        END IF;
        IF NEW.cantidad < 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad del movimiento no puede ser negativa';
        END IF;

        SET NEW.stock_anterior = v_stock;

        IF NEW.tipo = 'ajuste' THEN
            -- En un ajuste, la cantidad recibida es el nuevo stock real.
            SET v_nuevo_stock = NEW.cantidad;
            IF v_nuevo_stock = v_stock THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nuevo stock debe ser diferente al stock actual';
            END IF;
            SET NEW.cantidad = ABS(v_nuevo_stock - v_stock);
        ELSE
            IF NEW.cantidad <= 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad del movimiento debe ser mayor a 0';
            END IF;

            IF NEW.tipo = 'entrada' THEN
                SET v_nuevo_stock = v_stock + NEW.cantidad;
            ELSE
                SET v_nuevo_stock = v_stock - NEW.cantidad;
            END IF;

            IF v_nuevo_stock < 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para registrar la salida';
            END IF;
        END IF;

        IF NEW.origen IN ('ajuste_manual', 'ajuste_positivo', 'ajuste_negativo', 'inventario_inicial')
           AND (NEW.motivo IS NULL OR TRIM(NEW.motivo) = '') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El motivo del movimiento de inventario es requerido';
        END IF;

        SET v_nuevo_promedio = v_promedio;
        SET v_nuevo_costo_ultimo = v_costo_ultimo;

        IF NEW.tipo = 'entrada' THEN
            IF NEW.origen IN ('compra', 'inventario_inicial') THEN
                IF v_nuevo_stock > 0 THEN
                    SET v_nuevo_promedio = ROUND(
                        ((v_stock * v_promedio) + (NEW.cantidad * NEW.costo_unitario)) / v_nuevo_stock,
                        4
                    );
                ELSE
                    SET v_nuevo_promedio = NEW.costo_unitario;
                END IF;
                SET v_nuevo_costo_ultimo = NEW.costo_unitario;
            END IF;
        ELSE
            IF NEW.origen = 'anulacion_compra' THEN
                IF v_nuevo_stock <= 0 THEN
                    SET v_nuevo_promedio = 0;
                ELSE
                    SET v_nuevo_promedio = ROUND(
                        ((v_stock * v_promedio) - (NEW.cantidad * NEW.costo_unitario)) / v_nuevo_stock,
                        4
                    );
                    IF v_nuevo_promedio < 0 THEN
                        SET v_nuevo_promedio = 0;
                    END IF;
                END IF;

                SET v_nuevo_costo_ultimo = 0;
                SELECT dc.costo_unitario
                INTO v_nuevo_costo_ultimo
                FROM detalle_compra dc
                JOIN compras c ON c.id = dc.compra_id
                WHERE dc.producto_id = NEW.producto_id
                  AND c.estado = 'recibida'
                  AND NOT (NEW.referencia_tipo = 'compras' AND c.id = NEW.referencia_id)
                ORDER BY c.fecha DESC, c.id DESC, dc.id DESC
                LIMIT 1;
                SET v_nuevo_costo_ultimo = COALESCE(v_nuevo_costo_ultimo, 0);
            END IF;
        END IF;

        SET NEW.stock_nuevo = v_nuevo_stock;
        SET NEW.saldo_resultante = v_nuevo_stock;

        UPDATE productos
        SET stock_actual = v_nuevo_stock,
            costo_promedio = v_nuevo_promedio,
            costo_ultimo = v_nuevo_costo_ultimo,
            actualizado_en = CURRENT_TIMESTAMP
        WHERE id = NEW.producto_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_movimientos_before_update
BEFORE UPDATE ON movimientos_inventario
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los movimientos de inventario no se pueden modificar';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_movimientos_before_delete
BEFORE DELETE ON movimientos_inventario
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los movimientos de inventario no se pueden eliminar';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `ordenes_compra`
--

DROP TABLE IF EXISTS `ordenes_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ordenes_compra` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) NOT NULL,
  `proveedor_id` int(11) NOT NULL,
  `fecha` date NOT NULL DEFAULT curdate(),
  `fecha_esperada` date DEFAULT NULL,
  `estado` enum('borrador','enviada','recibida_parcial','recibida','cancelada') NOT NULL DEFAULT 'borrador',
  `notas` text DEFAULT NULL,
  `subtotal_estimado` decimal(14,2) NOT NULL DEFAULT 0.00,
  `iva_estimado` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_estimado` decimal(14,2) NOT NULL DEFAULT 0.00,
  `usuario_id` int(11) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `fk_ordenes_usuario` (`usuario_id`),
  KEY `idx_ordenes_numero` (`numero`),
  KEY `idx_ordenes_proveedor` (`proveedor_id`),
  KEY `idx_ordenes_fecha` (`fecha`),
  KEY `idx_ordenes_estado` (`estado`),
  KEY `idx_ordenes_esperada` (`fecha_esperada`),
  CONSTRAINT `fk_ordenes_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`),
  CONSTRAINT `fk_ordenes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_compra`
--

LOCK TABLES `ordenes_compra` WRITE;
/*!40000 ALTER TABLE `ordenes_compra` DISABLE KEYS */;
/*!40000 ALTER TABLE `ordenes_compra` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_ordenes_after_insert
AFTER INSERT ON ordenes_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id), 'ordenes_compra', NEW.id, 'crear', NULL,
             JSON_OBJECT(
                'id', NEW.id,
                'numero', NEW.numero,
                'proveedor_id', NEW.proveedor_id,
                'estado', NEW.estado,
                'total_estimado', NEW.total_estimado
             ));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_ordenes_after_update
AFTER UPDATE ON ordenes_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id, OLD.usuario_id), 'ordenes_compra', NEW.id, 'actualizar',
             JSON_OBJECT(
                'id', OLD.id,
                'numero', OLD.numero,
                'proveedor_id', OLD.proveedor_id,
                'estado', OLD.estado,
                'total_estimado', OLD.total_estimado
             ),
             JSON_OBJECT(
                'id', NEW.id,
                'numero', NEW.numero,
                'proveedor_id', NEW.proveedor_id,
                'estado', NEW.estado,
                'total_estimado', NEW.total_estimado
             ));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_ordenes_after_delete
AFTER DELETE ON ordenes_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, OLD.usuario_id), 'ordenes_compra', OLD.id, 'eliminar',
             JSON_OBJECT('id', OLD.id, 'numero', OLD.numero, 'total_estimado', OLD.total_estimado),
             NULL);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `pagos_compra`
--

DROP TABLE IF EXISTS `pagos_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pagos_compra` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `compra_id` int(11) NOT NULL,
  `fecha` date NOT NULL DEFAULT curdate(),
  `monto` decimal(14,2) NOT NULL,
  `metodo` enum('efectivo','transferencia','cheque','otro') NOT NULL DEFAULT 'efectivo',
  `referencia` varchar(100) DEFAULT NULL,
  `notas` varchar(255) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `estado` enum('activo','anulado') NOT NULL DEFAULT 'activo',
  `anulado_en` timestamp NULL DEFAULT NULL,
  `anulado_por` int(11) DEFAULT NULL,
  `anulacion_motivo` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_pagos_usuario` (`usuario_id`),
  KEY `idx_pagos_compra` (`compra_id`),
  KEY `idx_pagos_fecha` (`fecha`),
  KEY `idx_pagos_compra_estado` (`compra_id`,`estado`),
  KEY `idx_pagos_anulado_por` (`anulado_por`),
  CONSTRAINT `fk_pagos_anulado_por` FOREIGN KEY (`anulado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pagos_compra` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`),
  CONSTRAINT `fk_pagos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos_compra`
--

LOCK TABLES `pagos_compra` WRITE;
/*!40000 ALTER TABLE `pagos_compra` DISABLE KEYS */;
INSERT INTO `pagos_compra` VALUES (1,1,'2026-10-27',1680.00,'efectivo','Pago automático contado','Compra al contado',1,'activo',NULL,NULL,NULL,'2026-10-28 00:23:52','2026-10-30 21:48:16');
/*!40000 ALTER TABLE `pagos_compra` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_pagos_compra_before_insert
BEFORE INSERT ON pagos_compra
FOR EACH ROW
BEGIN
    DECLARE v_total DECIMAL(14,2);
    DECLARE v_estado_compra VARCHAR(20);
    DECLARE v_pagado DECIMAL(14,2);

    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SELECT total, estado INTO v_total, v_estado_compra
        FROM compras WHERE id = NEW.compra_id;

        IF v_total IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La compra del pago no existe';
        END IF;
        IF v_estado_compra = 'anulada' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se pueden registrar pagos en una compra anulada';
        END IF;
        IF NEW.monto <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El monto del pago debe ser mayor a 0';
        END IF;

        SELECT COALESCE(SUM(monto), 0) INTO v_pagado
        FROM pagos_compra
        WHERE compra_id = NEW.compra_id AND estado = 'activo';

        IF v_pagado + NEW.monto > v_total + 0.01 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El pago excede el saldo pendiente de la compra';
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_pagos_compra_after_insert
AFTER INSERT ON pagos_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        CALL sp_recalcular_finanzas_compra(NEW.compra_id);
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id), 'pagos_compra', NEW.id, 'crear', NULL,
             JSON_OBJECT(
                'id', NEW.id,
                'compra_id', NEW.compra_id,
                'fecha', NEW.fecha,
                'monto', NEW.monto,
                'metodo', NEW.metodo,
                'referencia', NEW.referencia,
                'estado', NEW.estado,
                'usuario_id', NEW.usuario_id
             ));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_pagos_compra_before_update
BEFORE UPDATE ON pagos_compra
FOR EACH ROW
BEGIN
    DECLARE v_total DECIMAL(14,2);
    DECLARE v_estado_compra VARCHAR(20);
    DECLARE v_pagado DECIMAL(14,2);

    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        IF NEW.compra_id <> OLD.compra_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede cambiar la compra de un pago';
        END IF;
        IF NEW.monto <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El monto del pago debe ser mayor a 0';
        END IF;
        IF OLD.estado = 'anulado' AND NEW.estado = 'activo' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede reactivar un pago anulado';
        END IF;
        IF NEW.estado = 'anulado' AND OLD.estado <> 'anulado' THEN
            IF NEW.anulacion_motivo IS NULL OR TRIM(NEW.anulacion_motivo) = '' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El motivo de anulación del pago es requerido';
            END IF;
            IF NEW.anulado_por IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario que anula el pago es requerido';
            END IF;
        END IF;

        SELECT total, estado INTO v_total, v_estado_compra
        FROM compras WHERE id = NEW.compra_id;

        IF v_estado_compra = 'anulada' AND NEW.estado = 'activo' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se pueden modificar pagos activos de una compra anulada';
        END IF;

        SELECT COALESCE(SUM(monto), 0) INTO v_pagado
        FROM pagos_compra
        WHERE compra_id = NEW.compra_id AND estado = 'activo';

        IF OLD.estado = 'activo' THEN
            SET v_pagado = GREATEST(0, v_pagado - OLD.monto);
        END IF;
        IF NEW.estado = 'activo' THEN
            SET v_pagado = v_pagado + NEW.monto;
        END IF;

        IF v_pagado > v_total + 0.01 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los pagos activos exceden el total de la compra';
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_pagos_compra_after_update
AFTER UPDATE ON pagos_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        CALL sp_recalcular_finanzas_compra(NEW.compra_id);
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id, OLD.usuario_id), 'pagos_compra', NEW.id,
             IF(NEW.estado = 'anulado' AND OLD.estado = 'activo', 'anular', 'actualizar'),
             JSON_OBJECT(
                'id', OLD.id,
                'compra_id', OLD.compra_id,
                'fecha', OLD.fecha,
                'monto', OLD.monto,
                'metodo', OLD.metodo,
                'referencia', OLD.referencia,
                'estado', OLD.estado,
                'anulacion_motivo', OLD.anulacion_motivo
             ),
             JSON_OBJECT(
                'id', NEW.id,
                'compra_id', NEW.compra_id,
                'fecha', NEW.fecha,
                'monto', NEW.monto,
                'metodo', NEW.metodo,
                'referencia', NEW.referencia,
                'estado', NEW.estado,
                'anulacion_motivo', NEW.anulacion_motivo
             ));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_pagos_compra_before_delete
BEFORE DELETE ON pagos_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se permite eliminar pagos; use la anulación lógica';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expira_en` datetime NOT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_token_hash` (`token_hash`),
  KEY `idx_usuario_expira` (`usuario_id`,`expira_en`),
  KEY `idx_token_usado` (`token_hash`,`usado`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permisos`
--

DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permisos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clave` varchar(80) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `modulo` varchar(40) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave` (`clave`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
INSERT INTO `permisos` VALUES (1,'inventario.productos.ver','Ver productos','Consultar el catálogo y existencias de productos.','inventario',1,'2026-10-25 16:51:02'),(2,'inventario.productos.ver_costos','Ver costos de productos','Consultar costo último, costo promedio y valor del inventario.','inventario',1,'2026-10-25 16:51:02'),(3,'inventario.productos.crear','Crear productos','Registrar productos nuevos.','inventario',1,'2026-10-25 16:51:02'),(4,'inventario.productos.editar','Editar productos','Modificar datos de productos sin alterar existencias.','inventario',1,'2026-10-25 16:51:02'),(5,'inventario.productos.eliminar','Eliminar productos','Eliminar productos sin compras, órdenes ni movimientos distintos al inventario inicial.','inventario',1,'2026-10-25 16:51:02'),(6,'inventario.categorias.ver','Ver categorías','Consultar las categorías de inventario.','inventario',1,'2026-10-25 16:51:02'),(7,'inventario.categorias.crear','Crear categorías','Registrar categorías de inventario.','inventario',1,'2026-10-25 16:51:02'),(8,'inventario.categorias.editar','Editar categorías','Modificar categorías de inventario.','inventario',1,'2026-10-25 16:51:02'),(9,'inventario.categorias.eliminar','Eliminar categorías','Eliminar categorías sin productos asociados.','inventario',1,'2026-10-25 16:51:02'),(10,'inventario.movimientos.ver','Ver movimientos','Consultar el historial de entradas y salidas.','inventario',1,'2026-10-25 16:51:02'),(11,'inventario.movimientos.ajustar','Ajustar inventario','Registrar ajustes positivos o negativos con motivo.','inventario',1,'2026-10-25 16:51:02'),(12,'inventario.reporte.ver','Ver reporte de inventario','Consultar el reporte valorizado y sus indicadores.','inventario',1,'2026-10-25 16:51:02'),(13,'inventario.reporte.exportar','Exportar reporte de inventario','Descargar el reporte en CSV, Excel o PDF.','inventario',1,'2026-10-25 16:51:02'),(14,'facturacion.clientes.ver','Ver clientes','Consultar el catálogo y el saldo de los clientes.','facturacion',1,'2026-10-25 16:51:02'),(15,'facturacion.clientes.crear','Crear clientes','Registrar clientes para facturación.','facturacion',1,'2026-10-25 16:51:02'),(16,'facturacion.clientes.editar','Editar clientes','Modificar datos y estado de los clientes.','facturacion',1,'2026-10-25 16:51:02'),(17,'facturacion.facturas.ver','Ver facturas','Consultar facturas emitidas y sus detalles.','facturacion',1,'2026-10-25 16:51:02'),(18,'facturacion.facturas.crear','Crear facturas','Emitir facturas y descontar inventario.','facturacion',1,'2026-10-25 16:51:02'),(19,'facturacion.facturas.anular','Anular facturas','Anular facturas y devolver el inventario.','facturacion',1,'2026-10-25 16:51:02'),(20,'facturacion.cobros.ver','Ver cobros','Consultar cuentas por cobrar e historial de cobros.','facturacion',1,'2026-10-25 16:51:02'),(21,'facturacion.cobros.registrar','Registrar cobros','Aplicar pagos a las facturas.','facturacion',1,'2026-10-25 16:51:02'),(22,'facturacion.cobros.anular','Anular cobros','Anular cobros aplicados a facturas.','facturacion',1,'2026-10-25 16:51:02'),(23,'facturacion.reporte.ver','Ver reporte de facturación','Consultar indicadores y reportes de facturación.','facturacion',1,'2026-10-25 16:51:02'),(24,'facturacion.reporte.exportar','Exportar reporte de facturación','Descargar el reporte de facturación en CSV o PDF.','facturacion',1,'2026-10-25 16:51:02'),(25,'facturacion.cobros.devolver','Registrar devoluciones','Registrar devoluciones parciales de ventas y devolver inventario.','facturacion',1,'2026-10-25 16:51:03'),(26,'seguridad.auditoria.ver','Ver auditoría','Consultar el registro de acciones sensibles del sistema.','seguridad',1,'2026-10-25 16:51:03');
/*!40000 ALTER TABLE `permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permisos_rol`
--

DROP TABLE IF EXISTS `permisos_rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permisos_rol` (
  `rol_id` int(11) NOT NULL,
  `permiso_id` int(11) NOT NULL,
  PRIMARY KEY (`rol_id`,`permiso_id`),
  KEY `fk_permisos_rol_permiso` (`permiso_id`),
  CONSTRAINT `fk_permisos_rol_permiso` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_permisos_rol_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos_rol`
--

LOCK TABLES `permisos_rol` WRITE;
/*!40000 ALTER TABLE `permisos_rol` DISABLE KEYS */;
INSERT INTO `permisos_rol` VALUES (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),(1,21),(1,22),(1,23),(1,24),(1,25),(1,26),(2,1),(2,14),(2,15),(2,16),(2,17),(2,18),(2,20),(2,21),(2,23),(2,24),(2,25),(3,1),(3,2),(3,3),(3,4),(3,6),(3,10),(3,11),(3,12),(3,13),(4,1),(4,14),(4,15),(4,16),(4,17),(4,20),(4,21),(4,23),(4,24),(4,25),(5,1),(6,1),(6,2),(6,3),(6,4),(6,6),(6,10),(6,12),(6,13);
/*!40000 ALTER TABLE `permisos_rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producto_proveedor`
--

DROP TABLE IF EXISTS `producto_proveedor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `producto_proveedor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `producto_id` int(11) NOT NULL,
  `proveedor_id` int(11) NOT NULL,
  `costo_ultimo` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `es_preferido` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_producto_proveedor` (`producto_id`,`proveedor_id`),
  KEY `idx_pp_producto` (`producto_id`),
  KEY `idx_pp_proveedor` (`proveedor_id`),
  KEY `idx_pp_preferido` (`es_preferido`),
  CONSTRAINT `fk_pp_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pp_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto_proveedor`
--

LOCK TABLES `producto_proveedor` WRITE;
/*!40000 ALTER TABLE `producto_proveedor` DISABLE KEYS */;
INSERT INTO `producto_proveedor` VALUES (1,1,1,75.0000,0,'2026-10-28 00:23:52','2026-10-28 00:23:52');
/*!40000 ALTER TABLE `producto_proveedor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) NOT NULL,
  `codigo_barras` varchar(80) DEFAULT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `imagen_miniatura` varchar(255) DEFAULT NULL,
  `imagen_mime` varchar(100) DEFAULT NULL,
  `categoria_id` int(11) DEFAULT NULL,
  `proveedor_id` int(11) DEFAULT NULL,
  `tipo` enum('producto','servicio') NOT NULL DEFAULT 'producto',
  `presentacion` varchar(100) DEFAULT NULL,
  `ubicacion` varchar(100) DEFAULT NULL,
  `unidad_medida` varchar(20) NOT NULL DEFAULT 'UNI',
  `stock_actual` decimal(12,3) NOT NULL DEFAULT 0.000,
  `stock_minimo` decimal(12,3) NOT NULL DEFAULT 0.000,
  `costo_ultimo` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `costo_promedio` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `precio_venta` decimal(12,2) NOT NULL DEFAULT 0.00,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  UNIQUE KEY `uq_productos_codigo_barras` (`codigo_barras`),
  KEY `idx_productos_codigo` (`codigo`),
  KEY `idx_productos_nombre` (`nombre`),
  KEY `idx_productos_categoria` (`categoria_id`),
  KEY `idx_productos_activo` (`activo`),
  KEY `idx_productos_stock_bajo` (`stock_actual`,`stock_minimo`),
  KEY `idx_productos_proveedor` (`proveedor_id`),
  CONSTRAINT `fk_productos_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_productos_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_productos_stock_no_negativo` CHECK (`stock_actual` >= 0 and `stock_minimo` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'P-MVRDG1JQSS4I',NULL,'PINTURA',NULL,NULL,NULL,NULL,NULL,1,'producto',NULL,NULL,'UNI',20.000,0.000,75.0000,75.0000,150.00,1,'2026-10-28 00:23:52','2026-10-28 00:23:52');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `proveedores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `nit` varchar(20) DEFAULT NULL,
  `dpi` varchar(20) DEFAULT NULL,
  `contacto_nombre` varchar(100) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `telefono2` varchar(30) DEFAULT NULL,
  `correo` varchar(120) DEFAULT NULL,
  `direccion` varchar(300) DEFAULT NULL,
  `dias_credito` int(11) NOT NULL DEFAULT 0,
  `notas` text DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proveedores_nit` (`nit`),
  KEY `idx_proveedores_nombre` (`nombre`),
  KEY `idx_proveedores_nit` (`nit`),
  KEY `idx_proveedores_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES (1,'CELCO','28912092','1234567891012','7762-0022','7762-0000',NULL,'celcoguatemala@gmail.com','ZONA 1 CIUDAD GUATEMALA',0,NULL,1,'2026-10-27 23:13:41','2026-10-27 23:13:41');
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_proveedores_after_insert
AFTER INSERT ON proveedores
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (@usuario_id, 'proveedores', NEW.id, 'crear', NULL,
             JSON_OBJECT(
                'id', NEW.id,
                'nombre', NEW.nombre,
                'nit', NEW.nit,
                'activo', NEW.activo
             ));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_proveedores_after_update
AFTER UPDATE ON proveedores
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (@usuario_id, 'proveedores', NEW.id, 'actualizar',
             JSON_OBJECT(
                'id', OLD.id,
                'nombre', OLD.nombre,
                'nit', OLD.nit,
                'activo', OLD.activo
             ),
             JSON_OBJECT(
                'id', NEW.id,
                'nombre', NEW.nombre,
                'nit', NEW.nit,
                'activo', NEW.activo
             ));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER trg_proveedores_after_delete
AFTER DELETE ON proveedores
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (@usuario_id, 'proveedores', OLD.id, 'eliminar',
             JSON_OBJECT('id', OLD.id, 'nombre', OLD.nombre, 'nit', OLD.nit),
             NULL);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `acceso_total` tinyint(1) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `superadmin` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el rol permite acceso total (superadmin)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'administrador','Acceso total a todos los módulos del sistema',1,1,'2026-10-25 16:50:53',1),(2,'ventas','Acceso al módulo de ventas',0,1,'2026-10-25 16:50:53',0),(3,'bodega','Acceso al módulo de inventario',0,1,'2026-10-25 16:50:53',0),(4,'caja','Acceso a facturación y cobros',0,1,'2026-10-25 16:50:53',0),(5,'reparto','Acceso a despachos',0,1,'2026-10-25 16:50:53',0),(6,'compras','Acceso a compras y abastecimiento',0,1,'2026-10-25 16:50:53',0);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `secuencias`
--

DROP TABLE IF EXISTS `secuencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `secuencias` (
  `nombre` varchar(40) NOT NULL,
  `anio` smallint(5) unsigned NOT NULL,
  `valor` bigint(20) unsigned NOT NULL DEFAULT 0,
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`nombre`,`anio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `secuencias`
--

LOCK TABLES `secuencias` WRITE;
/*!40000 ALTER TABLE `secuencias` DISABLE KEYS */;
INSERT INTO `secuencias` VALUES ('compras',2026,1,'2026-10-28 00:23:52');
/*!40000 ALTER TABLE `secuencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sesiones_caja`
--

DROP TABLE IF EXISTS `sesiones_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sesiones_caja` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `estado` enum('abierta','cerrada') NOT NULL DEFAULT 'abierta',
  `monto_inicial` decimal(12,2) NOT NULL DEFAULT 0.00,
  `fecha_apertura` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  `ventas_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `ventas_efectivo` decimal(12,2) NOT NULL DEFAULT 0.00,
  `ventas_tarjeta` decimal(12,2) NOT NULL DEFAULT 0.00,
  `ventas_transferencia` decimal(12,2) NOT NULL DEFAULT 0.00,
  `ventas_count` int(11) NOT NULL DEFAULT 0,
  `cobros_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cobros_efectivo` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cobros_tarjeta` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cobros_transferencia` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cobros_count` int(11) NOT NULL DEFAULT 0,
  `devoluciones_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `devoluciones_efectivo` decimal(12,2) NOT NULL DEFAULT 0.00,
  `devoluciones_tarjeta` decimal(12,2) NOT NULL DEFAULT 0.00,
  `devoluciones_transferencia` decimal(12,2) NOT NULL DEFAULT 0.00,
  `devoluciones_count` int(11) NOT NULL DEFAULT 0,
  `arqueo_detalle` longtext DEFAULT NULL,
  `monto_contado_tarjeta` decimal(12,2) DEFAULT NULL,
  `monto_contado_transferencia` decimal(12,2) DEFAULT NULL,
  `efectivo_esperado` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_contado` decimal(12,2) DEFAULT NULL,
  `diferencia` decimal(12,2) DEFAULT NULL,
  `observaciones` varchar(500) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sesiones_caja_usuario_estado` (`usuario_id`,`estado`),
  KEY `idx_sesiones_caja_apertura` (`fecha_apertura`),
  CONSTRAINT `fk_sesiones_caja_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesiones_caja`
--

LOCK TABLES `sesiones_caja` WRITE;
/*!40000 ALTER TABLE `sesiones_caja` DISABLE KEYS */;
INSERT INTO `sesiones_caja` VALUES (1,1,'abierta',100.00,'2026-10-30 21:15:04',NULL,0.00,0.00,0.00,0.00,0,0.00,0.00,0.00,0.00,0,0.00,0.00,0.00,0.00,0,NULL,NULL,NULL,0.00,NULL,NULL,NULL,'2026-10-30 21:15:04','2026-10-30 21:15:04');
/*!40000 ALTER TABLE `sesiones_caja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_roles`
--

DROP TABLE IF EXISTS `usuario_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario_roles` (
  `usuario_id` int(11) NOT NULL,
  `rol_id` int(11) NOT NULL,
  PRIMARY KEY (`usuario_id`,`rol_id`),
  KEY `fk_ur_rol` (`rol_id`),
  CONSTRAINT `fk_ur_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_roles`
--

LOCK TABLES `usuario_roles` WRITE;
/*!40000 ALTER TABLE `usuario_roles` DISABLE KEYS */;
INSERT INTO `usuario_roles` VALUES (1,1),(2,1);
/*!40000 ALTER TABLE `usuario_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `codigo` varchar(30) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `foto_mime` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` varchar(30) NOT NULL DEFAULT 'ventas',
  `departamento_id` int(11) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `uq_usuarios_codigo` (`codigo`),
  KEY `fk_usuarios_departamento` (`departamento_id`),
  KEY `idx_usuarios_email` (`email`),
  CONSTRAINT `fk_usuarios_departamento` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador','anthony1131cuellar@gmail.com','','ADM-001','admin',NULL,NULL,NULL,'$2a$10$68O.HrcpOiYXpImi40bZreOj90UlIA/Upcjy9lCPCUM8Do0cpG2fq','admin',NULL,1,'2026-10-25 16:51:10','2026-10-28 01:22:20'),(2,'Allan Abdias',NULL,'Bocel Shiloj','ADM-002','Allan Shiloj',NULL,NULL,NULL,'$2a$10$1gWg7.ER2wJTqRKEOeeIfOL5B7X8ACt/L2KSnIp5jlftVetI0Cl5u','administrador',6,1,'2026-10-30 21:52:48','2026-10-30 21:52:48');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ventas` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `numero` varchar(30) NOT NULL,
  `caja_id` bigint(20) NOT NULL,
  `factura_id` bigint(20) DEFAULT NULL,
  `cliente_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `iva` decimal(14,2) NOT NULL DEFAULT 0.00,
  `descuento` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` enum('efectivo','tarjeta','transferencia') NOT NULL,
  `monto_recibido` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cambio` decimal(14,2) NOT NULL DEFAULT 0.00,
  `referencia` varchar(100) DEFAULT NULL,
  `estado` enum('completada','anulada') NOT NULL DEFAULT 'completada',
  `anulada_en` timestamp NULL DEFAULT NULL,
  `anulada_por` int(11) DEFAULT NULL,
  `anulacion_motivo` varchar(255) DEFAULT NULL,
  `observaciones` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  UNIQUE KEY `uq_ventas_factura` (`factura_id`),
  KEY `fk_ventas_usuario` (`usuario_id`),
  KEY `fk_ventas_anulada_por` (`anulada_por`),
  KEY `idx_ventas_caja_estado` (`caja_id`,`estado`),
  KEY `idx_ventas_creado` (`creado_en`),
  KEY `idx_ventas_cliente` (`cliente_id`),
  KEY `idx_ventas_metodo` (`metodo_pago`),
  KEY `idx_ventas_fecha_estado_metodo` (`creado_en`,`estado`,`metodo_pago`),
  CONSTRAINT `fk_ventas_anulada_por` FOREIGN KEY (`anulada_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ventas_caja` FOREIGN KEY (`caja_id`) REFERENCES `sesiones_caja` (`id`),
  CONSTRAINT `fk_ventas_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `fk_ventas_factura` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ventas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'sgifep_db'
--
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_recalcular_finanzas_compra` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_recalcular_finanzas_compra`(IN p_compra_id INT)
BEGIN
    UPDATE compras c
    SET c.monto_pagado = COALESCE((
            SELECT SUM(p.monto)
            FROM pagos_compra p
            WHERE p.compra_id = c.id AND p.estado = 'activo'
        ), 0),
        c.saldo_pendiente = GREATEST(0, c.total - COALESCE((
            SELECT SUM(p.monto)
            FROM pagos_compra p
            WHERE p.compra_id = c.id AND p.estado = 'activo'
        ), 0)),
        c.estado_pago = CASE
            WHEN c.total - COALESCE((
                SELECT SUM(p.monto)
                FROM pagos_compra p
                WHERE p.compra_id = c.id AND p.estado = 'activo'
            ), 0) <= 0.01 THEN 'pagada'
            WHEN COALESCE((
                SELECT SUM(p.monto)
                FROM pagos_compra p
                WHERE p.compra_id = c.id AND p.estado = 'activo'
            ), 0) > 0 THEN 'parcial'
            ELSE 'pendiente'
        END,
        c.actualizado_en = CURRENT_TIMESTAMP
    WHERE c.id = p_compra_id AND c.estado = 'recibida';
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_recalcular_totales_orden` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_recalcular_totales_orden`(IN p_orden_id INT)
BEGIN
    UPDATE ordenes_compra oc
    LEFT JOIN (
        SELECT orden_id,
               ROUND(COALESCE(SUM(cantidad_solicitada * costo_estimado), 0), 2) AS subtotal,
               ROUND(COALESCE(SUM(cantidad_solicitada * costo_estimado), 0) * 0.12, 2) AS iva
        FROM detalle_orden_compra
        WHERE orden_id = p_orden_id
        GROUP BY orden_id
    ) t ON t.orden_id = oc.id
    SET oc.subtotal_estimado = COALESCE(t.subtotal, 0),
        oc.iva_estimado = COALESCE(t.iva, 0),
        oc.total_estimado = ROUND(COALESCE(t.subtotal, 0) + COALESCE(t.iva, 0), 2),
        oc.actualizado_en = CURRENT_TIMESTAMP
    WHERE oc.id = p_orden_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-30 16:16:59
