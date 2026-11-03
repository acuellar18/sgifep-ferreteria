-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: sgifep_db
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
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria_eventos`
--

LOCK TABLES `auditoria_eventos` WRITE;
/*!40000 ALTER TABLE `auditoria_eventos` DISABLE KEYS */;
INSERT INTO `auditoria_eventos` VALUES (1,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-27 20:25:02'),(2,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-28 01:09:34'),(3,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-28 01:41:45'),(4,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-28 15:42:42'),(5,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-30 21:12:42'),(6,NULL,'x','auth.login.fallido','usuarios',NULL,'Intento de inicio de sesión con usuario inexistente',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-GT) WindowsPowerShell/5.1.22621.6133','2026-10-30 21:54:26'),(7,NULL,'x','auth.login.fallido','usuarios',NULL,'Intento de inicio de sesión con usuario inexistente',NULL,'::ffff:127.0.0.1','curl/8.13.0','2026-10-30 21:54:43'),(8,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-30 23:28:39'),(9,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-30 23:29:08'),(10,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 00:15:06'),(11,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 00:23:28'),(12,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 00:27:25'),(13,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 00:29:14'),(14,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 00:29:42'),(15,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 00:30:40'),(16,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 00:30:51'),(17,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 00:43:50'),(18,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 00:49:16'),(19,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-GT) WindowsPowerShell/5.1.22621.6133','2026-10-31 01:10:04'),(20,1,NULL,'pos.venta.crear','ventas','1','Venta VEN-2026-000001 por Q19.00','{\"numero\":\"VEN-2026-000001\",\"factura_id\":1,\"metodo_pago\":\"efectivo\",\"total\":19}',NULL,NULL,'2026-10-31 01:18:10'),(21,1,NULL,'pos.venta.crear','ventas','2','Venta VEN-2026-000002 por Q19.00','{\"numero\":\"VEN-2026-000002\",\"factura_id\":2,\"metodo_pago\":\"efectivo\",\"total\":19}',NULL,NULL,'2026-10-31 01:22:35'),(22,1,NULL,'pos.venta.crear','ventas','3','Venta VEN-2026-000003 por Q15.00','{\"numero\":\"VEN-2026-000003\",\"factura_id\":3,\"metodo_pago\":\"efectivo\",\"total\":15}',NULL,NULL,'2026-10-31 02:13:37'),(23,1,NULL,'pos.venta.crear','ventas','4','Venta VEN-2026-000004 por Q19.00','{\"numero\":\"VEN-2026-000004\",\"factura_id\":4,\"metodo_pago\":\"efectivo\",\"total\":19}',NULL,NULL,'2026-10-31 02:40:02'),(24,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 16:09:44'),(25,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 16:10:04'),(26,1,NULL,'caja.cerrar','sesiones_caja','1','Cierre de caja con diferencia de Q-172.00','{\"monto_inicial\":100,\"efectivo_esperado\":172,\"monto_contado\":0,\"diferencia\":-172,\"diferencia_tarjeta\":0,\"diferencia_transferencia\":0,\"observaciones\":null}',NULL,NULL,'2026-10-31 16:10:55'),(27,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 16:26:25'),(28,1,NULL,'pos.venta.crear','ventas','5','Venta VEN-2026-000005 por Q15.00','{\"numero\":\"VEN-2026-000005\",\"factura_id\":5,\"metodo_pago\":\"efectivo\",\"total\":15}',NULL,NULL,'2026-10-31 16:38:03'),(29,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 16:49:44'),(30,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 16:49:48'),(31,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 16:50:00'),(32,NULL,'Andy Shiloj','auth.login','usuarios','3','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 16:52:10'),(33,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 16:55:18'),(34,NULL,'Andy Shiloj','auth.login','usuarios','3','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 16:57:01'),(35,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 16:57:44'),(36,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 17:01:11'),(37,1,NULL,'caja.cerrar','sesiones_caja','2','Cierre de caja con diferencia de Q-115.00','{\"monto_inicial\":100,\"efectivo_esperado\":115,\"monto_contado\":0,\"diferencia\":-115,\"diferencia_tarjeta\":0,\"diferencia_transferencia\":0,\"observaciones\":null}',NULL,NULL,'2026-10-31 17:01:47'),(38,1,NULL,'pos.venta.crear','ventas','6','Venta VEN-2026-000006 por Q19.00','{\"numero\":\"VEN-2026-000006\",\"factura_id\":8,\"metodo_pago\":\"efectivo\",\"total\":19}',NULL,NULL,'2026-10-31 17:04:21'),(39,1,NULL,'facturacion.cobro.registrar','facturas','7','Cobro de Q29.12 a factura FAC-2026-000007','{\"factura_id\":\"7\",\"cobro_id\":7,\"metodo_pago\":\"efectivo\",\"monto\":29.12,\"saldo_pendiente\":0}',NULL,NULL,'2026-10-31 17:06:18'),(40,NULL,'Marvin Cuc','auth.login','usuarios','5','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 17:09:05'),(41,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 17:09:57'),(42,1,NULL,'pos.venta.crear','ventas','7','Venta VEN-2026-000007 por Q150.00','{\"numero\":\"VEN-2026-000007\",\"factura_id\":10,\"metodo_pago\":\"efectivo\",\"total\":150}',NULL,NULL,'2026-10-31 17:32:17'),(43,1,NULL,'facturacion.cobro.registrar','facturas','11','Cobro de Q168.00 a factura FAC-2026-000011','{\"factura_id\":\"11\",\"cobro_id\":9,\"metodo_pago\":\"efectivo\",\"monto\":168,\"saldo_pendiente\":0}',NULL,NULL,'2026-10-31 17:33:58'),(44,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-10-31 17:49:51'),(45,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-01 04:22:47'),(46,NULL,'admin','auth.password.reset_token','usuarios',NULL,'Contraseña restablecida con token seguro',NULL,NULL,NULL,'2026-11-02 18:37:49'),(47,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-02 18:37:58'),(48,NULL,'test.registro.qa','auth.registro.publico','usuarios','6','Solicitud de registro público (cuenta creada inactiva y sin roles)',NULL,'::ffff:127.0.0.1',NULL,'2026-11-02 18:44:00'),(49,NULL,'andy','auth.registro.publico','usuarios','7','Solicitud de registro público (cuenta creada inactiva y sin roles)',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-02 18:48:16'),(50,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-02 18:48:51'),(51,NULL,'andy','auth.login','usuarios','7','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-02 18:49:45'),(52,NULL,'andy','auth.login','usuarios','7','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-02 18:52:29'),(53,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-02 18:52:34'),(54,NULL,'andy','auth.registro.publico','usuarios','8','Solicitud de registro público (cuenta creada inactiva y sin roles)',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-02 18:54:56'),(55,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-02 18:55:08'),(56,8,'andy','auth.login','usuarios','8','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-02 19:01:01'),(57,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-02 19:01:40'),(58,1,'admin','auth.login.fallido','usuarios','1','Contraseña incorrecta',NULL,'::ffff:127.0.0.1',NULL,'2026-11-02 19:03:53'),(59,1,NULL,'caja.cerrar','sesiones_caja','3','Cierre de caja con diferencia de Q0.00','{\"monto_inicial\":100,\"efectivo_esperado\":466.12,\"monto_contado\":466.12,\"diferencia\":0,\"diferencia_tarjeta\":0,\"diferencia_transferencia\":0,\"observaciones\":null}',NULL,NULL,'2026-11-02 19:04:13'),(60,1,'admin','auth.login.fallido','usuarios','1','Contraseña incorrecta',NULL,'::ffff:127.0.0.1',NULL,'2026-11-02 19:04:54'),(61,1,'admin','auth.login','usuarios','1','Inicio de sesión exitoso',NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-03 01:51:18');
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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora_auditoria`
--

LOCK TABLES `bitacora_auditoria` WRITE;
/*!40000 ALTER TABLE `bitacora_auditoria` DISABLE KEYS */;
INSERT INTO `bitacora_auditoria` VALUES (1,NULL,'proveedores',1,'crear',NULL,'{\"id\": 1, \"nombre\": \"CELCO\", \"nit\": \"28912092\", \"activo\": 1}','2026-10-27 23:13:41'),(2,1,'compras',1,'crear',NULL,'{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"fecha\": \"2026-10-27\", \"total\": 1680.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-28 00:23:52'),(3,1,'compras',1,'actualizar','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-28 00:23:52'),(4,1,'pagos_compra',1,'crear',NULL,'{\"id\": 1, \"compra_id\": 1, \"fecha\": \"2026-10-27\", \"monto\": 1680.00, \"metodo\": \"efectivo\", \"referencia\": \"Pago automático contado\", \"estado\": \"activo\", \"usuario_id\": 1}','2026-10-28 00:23:52'),(5,1,'compras',1,'actualizar','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-28 00:23:52'),(14,1,'compras',1,'actualizar','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 1, \"numero\": \"C-2026-000001\", \"proveedor_id\": 1, \"total\": 1680.00, \"monto_pagado\": 1680.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-30 21:48:16'),(15,1,'pagos_compra',1,'actualizar','{\"id\": 1, \"compra_id\": 1, \"fecha\": \"2026-10-27\", \"monto\": 1680.00, \"metodo\": \"efectivo\", \"referencia\": \"Pago automático contado\", \"estado\": \"activo\", \"anulacion_motivo\": null}','{\"id\": 1, \"compra_id\": 1, \"fecha\": \"2026-10-27\", \"monto\": 1680.00, \"metodo\": \"efectivo\", \"referencia\": \"Pago automático contado\", \"estado\": \"activo\", \"anulacion_motivo\": null}','2026-10-30 21:48:16'),(16,NULL,'proveedores',2,'crear',NULL,'{\"id\": 2, \"nombre\": \"DIDISA\", \"nit\": null, \"activo\": 1}','2026-10-31 00:50:57'),(17,1,'compras',4,'crear',NULL,'{\"id\": 4, \"numero\": \"C-2026-000002\", \"proveedor_id\": 2, \"fecha\": \"2026-10-29\", \"total\": 198.20, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-31 00:56:55'),(18,1,'compras',4,'actualizar','{\"id\": 4, \"numero\": \"C-2026-000002\", \"proveedor_id\": 2, \"total\": 198.20, \"monto_pagado\": 198.20, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 4, \"numero\": \"C-2026-000002\", \"proveedor_id\": 2, \"total\": 198.20, \"monto_pagado\": 198.20, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-31 00:56:55'),(19,1,'pagos_compra',4,'crear',NULL,'{\"id\": 4, \"compra_id\": 4, \"fecha\": \"2026-10-29\", \"monto\": 198.20, \"metodo\": \"efectivo\", \"referencia\": \"Pago automático contado\", \"estado\": \"activo\", \"usuario_id\": 1}','2026-10-31 00:56:55'),(20,1,'compras',4,'actualizar','{\"id\": 4, \"numero\": \"C-2026-000002\", \"proveedor_id\": 2, \"total\": 198.20, \"monto_pagado\": 198.20, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 4, \"numero\": \"C-2026-000002\", \"proveedor_id\": 2, \"total\": 198.20, \"monto_pagado\": 198.20, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-31 00:56:55'),(21,NULL,'proveedores',3,'crear',NULL,'{\"id\": 3, \"nombre\": \"Proveedor productos 1793409337166\", \"nit\": \"NIT-1793409337166\", \"activo\": 1}','2026-10-31 01:15:37'),(23,NULL,'proveedores',4,'crear',NULL,'{\"id\": 4, \"nombre\": \"EL PACIFICO\", \"nit\": null, \"activo\": 1}','2026-10-31 16:29:17'),(24,1,'compras',6,'crear',NULL,'{\"id\": 6, \"numero\": \"C-2026-000003\", \"proveedor_id\": 4, \"fecha\": \"2026-10-31\", \"total\": 415.24, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-31 16:31:54'),(25,1,'compras',6,'actualizar','{\"id\": 6, \"numero\": \"C-2026-000003\", \"proveedor_id\": 4, \"total\": 415.24, \"monto_pagado\": 415.24, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 6, \"numero\": \"C-2026-000003\", \"proveedor_id\": 4, \"total\": 415.24, \"monto_pagado\": 415.24, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-31 16:31:54'),(26,1,'pagos_compra',5,'crear',NULL,'{\"id\": 5, \"compra_id\": 6, \"fecha\": \"2026-10-31\", \"monto\": 415.24, \"metodo\": \"efectivo\", \"referencia\": \"Pago automático contado\", \"estado\": \"activo\", \"usuario_id\": 1}','2026-10-31 16:31:54'),(27,1,'compras',6,'actualizar','{\"id\": 6, \"numero\": \"C-2026-000003\", \"proveedor_id\": 4, \"total\": 415.24, \"monto_pagado\": 415.24, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 6, \"numero\": \"C-2026-000003\", \"proveedor_id\": 4, \"total\": 415.24, \"monto_pagado\": 415.24, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-31 16:31:54'),(28,NULL,'proveedores',1,'actualizar','{\"id\": 1, \"nombre\": \"CELCO\", \"nit\": \"28912092\", \"activo\": 1}','{\"id\": 1, \"nombre\": \"CELCO\", \"nit\": \"28912092\", \"activo\": 0}','2026-10-31 17:12:03'),(29,NULL,'proveedores',1,'actualizar','{\"id\": 1, \"nombre\": \"CELCO\", \"nit\": \"28912092\", \"activo\": 0}','{\"id\": 1, \"nombre\": \"CELCO\", \"nit\": \"28912092\", \"activo\": 1}','2026-10-31 17:12:15'),(30,NULL,'proveedores',2,'actualizar','{\"id\": 2, \"nombre\": \"DIDISA\", \"nit\": null, \"activo\": 1}','{\"id\": 2, \"nombre\": \"DIDISA\", \"nit\": null, \"activo\": 0}','2026-10-31 17:12:26'),(31,NULL,'proveedores',2,'actualizar','{\"id\": 2, \"nombre\": \"DIDISA\", \"nit\": null, \"activo\": 0}','{\"id\": 2, \"nombre\": \"DIDISA\", \"nit\": null, \"activo\": 1}','2026-10-31 17:12:33'),(32,NULL,'proveedores',5,'crear',NULL,'{\"id\": 5, \"nombre\": \"DISTRIBUIDORA Y FERRETERIA ASTURIAS\", \"nit\": \"123345678\", \"activo\": 1}','2026-10-31 17:13:46'),(33,1,'compras',7,'crear',NULL,'{\"id\": 7, \"numero\": \"C-2026-000004\", \"proveedor_id\": 5, \"fecha\": \"2026-10-31\", \"total\": 413.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-31 17:15:04'),(34,1,'compras',7,'actualizar','{\"id\": 7, \"numero\": \"C-2026-000004\", \"proveedor_id\": 5, \"total\": 413.00, \"monto_pagado\": 413.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 7, \"numero\": \"C-2026-000004\", \"proveedor_id\": 5, \"total\": 413.00, \"monto_pagado\": 413.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-31 17:15:04'),(35,1,'pagos_compra',6,'crear',NULL,'{\"id\": 6, \"compra_id\": 7, \"fecha\": \"2026-10-31\", \"monto\": 413.00, \"metodo\": \"efectivo\", \"referencia\": \"Pago automático contado\", \"estado\": \"activo\", \"usuario_id\": 1}','2026-10-31 17:15:04'),(36,1,'compras',7,'actualizar','{\"id\": 7, \"numero\": \"C-2026-000004\", \"proveedor_id\": 5, \"total\": 413.00, \"monto_pagado\": 413.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 7, \"numero\": \"C-2026-000004\", \"proveedor_id\": 5, \"total\": 413.00, \"monto_pagado\": 413.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-31 17:15:04'),(37,1,'compras',8,'crear',NULL,'{\"id\": 8, \"numero\": \"C-2026-000005\", \"proveedor_id\": 1, \"fecha\": \"2026-10-31\", \"total\": 1400.00, \"estado\": \"recibida\", \"estado_pago\": \"pendiente\"}','2026-10-31 17:21:33'),(38,1,'compras',8,'actualizar','{\"id\": 8, \"numero\": \"C-2026-000005\", \"proveedor_id\": 1, \"total\": 1400.00, \"monto_pagado\": 0.00, \"saldo_pendiente\": 1400.00, \"estado\": \"recibida\", \"estado_pago\": \"pendiente\"}','{\"id\": 8, \"numero\": \"C-2026-000005\", \"proveedor_id\": 1, \"total\": 1400.00, \"monto_pagado\": 1400.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-31 17:22:01'),(39,1,'pagos_compra',7,'crear',NULL,'{\"id\": 7, \"compra_id\": 8, \"fecha\": \"2026-10-31\", \"monto\": 1400.00, \"metodo\": \"efectivo\", \"referencia\": null, \"estado\": \"activo\", \"usuario_id\": 1}','2026-10-31 17:22:01'),(40,1,'compras',8,'actualizar','{\"id\": 8, \"numero\": \"C-2026-000005\", \"proveedor_id\": 1, \"total\": 1400.00, \"monto_pagado\": 1400.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','{\"id\": 8, \"numero\": \"C-2026-000005\", \"proveedor_id\": 1, \"total\": 1400.00, \"monto_pagado\": 1400.00, \"saldo_pendiente\": 0.00, \"estado\": \"recibida\", \"estado_pago\": \"pagada\"}','2026-10-31 17:22:01');
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (2,'Tubería y Conexiones','Tuberías PVC, cobre, galvanizado y sus conexiones',0,'2026-10-31 16:14:16'),(3,'Pinturas y Recubrimientos','Pinturas, esmaltes, selladores, impermeabilizantes',1,'2026-10-31 16:14:16'),(4,'Herramientas Manuales','Martillos, llaves, alicates, destornilladores, sierras',1,'2026-10-31 16:14:16'),(5,'Herramientas Eléctricas','Taladros, sierras eléctricas, amoladoras, pulidoras',1,'2026-10-31 16:14:16'),(6,'Material Eléctrico','Cables, interruptores, tomacorrientes, breakers, tableros',1,'2026-10-31 16:14:16'),(7,'Cerrajería y Seguridad','Cerraduras, candados, bisagras, pestillos, alarmas',1,'2026-10-31 16:14:16'),(8,'Tornillería y Fijación','Tornillos, clavos, tarugos, anclajes, pernos',1,'2026-10-31 16:14:16'),(9,'Plomería y Sanitarios','Llaves de paso, válvulas, sanitarios, grifería',1,'2026-10-31 16:14:16'),(10,'Ferretería General','Productos varios de ferretería',1,'2026-10-31 16:14:16'),(11,'DESARMADORES',NULL,1,'2026-10-31 01:04:47'),(14,'BROCHAS',NULL,1,'2026-10-31 16:33:11');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'CF','Consumidor Final',NULL,NULL,NULL,0,0.00,'activo','2026-10-25 16:51:02'),(4,'1234566893','ALLAN ABDIAS',NULL,NULL,'SOLOLA',30,3000.00,'activo','2026-10-31 01:22:35'),(6,'12345678','ALLAN TZOC',NULL,NULL,'SOLOLA',0,0.00,'activo','2026-10-31 16:38:03'),(7,'28842718908','Anthony Cuellar','77620000','antony@gmail.com','panajachel',60,500.00,'activo','2026-10-31 17:31:27');
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cobros`
--

LOCK TABLES `cobros` WRITE;
/*!40000 ALTER TABLE `cobros` DISABLE KEYS */;
INSERT INTO `cobros` VALUES (1,1,1,1,1,1,'efectivo',19.00,NULL,NULL,'registrado',NULL,NULL,'2026-10-31 01:18:10'),(2,2,2,4,1,1,'efectivo',19.00,NULL,NULL,'registrado',NULL,NULL,'2026-10-31 01:22:35'),(3,3,3,1,1,1,'efectivo',15.00,NULL,NULL,'registrado',NULL,NULL,'2026-10-31 02:13:37'),(4,4,4,1,1,1,'efectivo',19.00,NULL,NULL,'registrado',NULL,NULL,'2026-10-31 02:40:02'),(5,5,5,6,1,2,'efectivo',15.00,NULL,NULL,'registrado',NULL,NULL,'2026-10-31 16:38:03'),(6,6,8,6,1,3,'efectivo',19.00,NULL,NULL,'registrado',NULL,NULL,'2026-10-31 17:04:21'),(7,NULL,7,4,1,3,'efectivo',29.12,'N','M','registrado',NULL,NULL,'2026-10-31 17:06:18'),(8,7,10,7,1,3,'efectivo',150.00,NULL,NULL,'registrado',NULL,NULL,'2026-10-31 17:32:17'),(9,NULL,11,7,1,3,'efectivo',168.00,'12892','pago cancelado','registrado',NULL,NULL,'2026-10-31 17:33:58');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
INSERT INTO `compras` VALUES (1,'C-2026-000001',1,'2026-10-27',NULL,NULL,'contado',NULL,1500.00,180.00,1680.00,1680.00,0.00,'pagada','recibida',NULL,NULL,1,NULL,'2026-10-28 00:23:52','2026-10-30 21:48:16',NULL,NULL,NULL),(4,'C-2026-000002',2,'2026-10-29','12345678','A','contado',NULL,176.96,21.24,198.20,198.20,0.00,'pagada','recibida',NULL,'CONTADO',1,NULL,'2026-10-31 00:56:55','2026-10-31 00:56:55',NULL,NULL,NULL),(6,'C-2026-000003',4,'2026-10-31','123456','A','contado',NULL,370.75,44.49,415.24,415.24,0.00,'pagada','recibida',NULL,NULL,1,NULL,'2026-10-31 16:31:54','2026-10-31 16:31:54',NULL,NULL,NULL),(7,'C-2026-000004',5,'2026-10-31','12345678','A','contado',NULL,368.75,44.25,413.00,413.00,0.00,'pagada','recibida',NULL,NULL,1,NULL,'2026-10-31 17:15:04','2026-10-31 17:15:04',NULL,NULL,NULL),(8,'C-2026-000005',1,'2026-10-31','12345678','A','credito','2026-11-07',1250.00,150.00,1400.00,1400.00,0.00,'pagada','recibida',NULL,'CREDITO HASTA EL 7/11/2026',1,NULL,'2026-10-31 17:21:33','2026-10-31 17:22:01',NULL,NULL,NULL);
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
-- Table structure for table `conductores`
--

DROP TABLE IF EXISTS `conductores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conductores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conductores`
--

LOCK TABLES `conductores` WRITE;
/*!40000 ALTER TABLE `conductores` DISABLE KEYS */;
INSERT INTO `conductores` VALUES (1,'Carlos Mendoza','9998-1122',1,'2026-10-31 16:14:17'),(2,'Marta López','7777-3344',1,'2026-10-31 16:14:17');
/*!40000 ALTER TABLE `conductores` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_departamentos_nombre` (`nombre`)
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
-- Table structure for table `despacho_detalle`
--

DROP TABLE IF EXISTS `despacho_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `despacho_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `despacho_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 0,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `entregado` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_despacho_detalle_despacho` (`despacho_id`),
  KEY `fk_despacho_detalle_producto` (`producto_id`),
  CONSTRAINT `fk_despacho_detalle_despacho` FOREIGN KEY (`despacho_id`) REFERENCES `despachos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_despacho_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `despacho_detalle`
--

LOCK TABLES `despacho_detalle` WRITE;
/*!40000 ALTER TABLE `despacho_detalle` DISABLE KEYS */;
INSERT INTO `despacho_detalle` VALUES (1,1,6,1,0.00,0),(2,2,1,1,0.00,0),(3,3,16,1,0.00,0);
/*!40000 ALTER TABLE `despacho_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `despacho_historial`
--

DROP TABLE IF EXISTS `despacho_historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `despacho_historial` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `despacho_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `de_estado` varchar(20) DEFAULT NULL,
  `a_estado` varchar(20) NOT NULL,
  `comentario` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_despacho_historial_despacho` (`despacho_id`,`creado_en`),
  KEY `fk_despacho_historial_usuario` (`usuario_id`),
  CONSTRAINT `fk_despacho_historial_despacho` FOREIGN KEY (`despacho_id`) REFERENCES `despachos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_despacho_historial_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `despacho_historial`
--

LOCK TABLES `despacho_historial` WRITE;
/*!40000 ALTER TABLE `despacho_historial` DISABLE KEYS */;
INSERT INTO `despacho_historial` VALUES (1,1,1,NULL,'pendiente','Creación del despacho','2026-10-31 16:15:25'),(2,1,1,'programado','en_ruta','Passado a ruta RTA-000001','2026-10-31 16:15:57'),(3,1,1,'en_ruta','entregado','Cambio de estado desde el listado','2026-10-31 16:16:03'),(4,2,1,NULL,'pendiente','Creación del despacho','2026-10-31 17:35:29'),(5,2,1,'pendiente','programado','Cambio de estado desde el listado','2026-10-31 17:35:45'),(6,2,1,'programado','en_ruta','Cambio de estado desde el listado','2026-10-31 17:35:51'),(7,2,1,'en_ruta','entregado','Cambio de estado desde el listado','2026-10-31 17:35:55'),(8,2,1,'entregado','entrega_parcial','Cambio de estado desde el listado','2026-10-31 17:35:57'),(9,2,1,'entrega_parcial','entregado','Cambio de estado desde el listado','2026-10-31 17:36:17'),(10,3,1,NULL,'pendiente','Creación del despacho','2026-10-31 17:37:12'),(11,3,1,'programado','en_ruta','Passado a ruta RTA-000002','2026-10-31 17:37:44'),(12,3,1,'en_ruta','entrega_parcial','Cambio de estado desde el listado','2026-10-31 17:38:06'),(13,3,1,'entrega_parcial','entregado','Cambio de estado desde el listado','2026-10-31 17:38:15');
/*!40000 ALTER TABLE `despacho_historial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `despachos`
--

DROP TABLE IF EXISTS `despachos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `despachos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) DEFAULT NULL,
  `venta_id` bigint(20) DEFAULT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `direccion_entrega` varchar(500) DEFAULT NULL,
  `telefono_contacto` varchar(50) DEFAULT NULL,
  `fecha_programada` date DEFAULT NULL,
  `fecha_entregado` datetime DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `estado` enum('pendiente','programado','en_ruta','entregado','entrega_parcial','fallido','cancelado') NOT NULL DEFAULT 'pendiente',
  `usuario_id` int(11) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_despachos_codigo` (`codigo`),
  KEY `idx_despachos_estado` (`estado`),
  KEY `idx_despachos_fecha_programada` (`fecha_programada`),
  KEY `idx_despachos_cliente` (`cliente_id`),
  KEY `idx_despachos_venta` (`venta_id`),
  KEY `fk_despachos_usuario` (`usuario_id`),
  CONSTRAINT `fk_despachos_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_despachos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_despachos_venta` FOREIGN KEY (`venta_id`) REFERENCES `facturas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `despachos`
--

LOCK TABLES `despachos` WRITE;
/*!40000 ALTER TABLE `despachos` DISABLE KEYS */;
INSERT INTO `despachos` VALUES (1,'DSP-000001',4,1,'solola','77620000','2026-10-31','2026-10-31 16:16:03',NULL,'cancelado',1,'2026-10-31 16:15:25','2026-10-31 17:37:59'),(2,'DSP-000002',11,7,'panajachel','77620000','2026-10-31','2026-10-31 17:36:17',NULL,'entregado',1,'2026-10-31 17:35:29','2026-10-31 17:36:17'),(3,'DSP-000003',9,4,'SOLOLA',NULL,'2026-10-31','2026-10-31 17:38:15',NULL,'entregado',1,'2026-10-31 17:37:12','2026-10-31 17:38:15');
/*!40000 ALTER TABLE `despachos` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_compra`
--

LOCK TABLES `detalle_compra` WRITE;
/*!40000 ALTER TABLE `detalle_compra` DISABLE KEYS */;
INSERT INTO `detalle_compra` VALUES (1,1,1,20.000,75.0000,150.00,1500.00),(4,4,4,2.000,19.2400,26.00,38.48),(5,4,5,2.000,10.6000,15.00,21.20),(6,4,6,2.000,12.2500,19.00,24.50),(7,4,7,2.000,12.8800,19.00,25.76),(8,4,8,2.000,17.0200,24.00,34.04),(9,4,9,2.000,16.4900,22.00,32.98),(10,6,10,2.000,125.0000,150.00,250.00),(11,6,11,5.000,4.4000,8.00,22.00),(12,6,12,5.000,5.5000,10.00,27.50),(13,6,13,5.000,6.2500,12.00,31.25),(14,6,14,5.000,8.0000,13.00,40.00),(15,7,15,25.000,14.7500,15.00,368.75),(16,8,16,50.000,25.0000,150.00,1250.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_factura`
--

LOCK TABLES `detalle_factura` WRITE;
/*!40000 ALTER TABLE `detalle_factura` DISABLE KEYS */;
INSERT INTO `detalle_factura` VALUES (1,1,6,'P-MVVOY3DHW8NG','FORMON/M AMARILLO VICTORY CORTO 3/4','UNI','producto',1.000,19.00,12.2500,19.00),(2,2,6,'P-MVVOY3DHW8NG','FORMON/M AMARILLO VICTORY CORTO 3/4','UNI','producto',1.000,19.00,12.2500,19.00),(3,3,5,'P-MVVOY3DGPJPK','FORMON/M AMARILLO VICTORY CORTO 1/4','UNI','producto',1.000,15.00,10.6000,15.00),(4,4,6,'P-MVVOY3DHW8NG','FORMON/M AMARILLO VICTORY CORTO 3/4','UNI','producto',1.000,19.00,12.2500,19.00),(5,5,5,'P-MVVOY3DGPJPK','FORMON/M AMARILLO VICTORY CORTO 1/4','UNI','producto',1.000,15.00,10.6000,15.00),(6,6,4,'P-MVVOY3DD7QRX','FORMON /M AZUL VICTORY 38mm','UNI','producto',1.000,26.00,19.2400,26.00),(7,7,4,'P-MVVOY3DD7QRX','FORMON /M AZUL VICTORY 38mm','UNI','producto',1.000,26.00,19.2400,26.00),(8,8,6,'P-MVVOY3DHW8NG','FORMON/M AMARILLO VICTORY CORTO 3/4','UNI','producto',1.000,19.00,12.2500,19.00),(9,9,16,'P-MVWO4C7K1UYE','PINTURA CELCO COLOR NARANJA','UNI','producto',1.000,150.00,25.0000,150.00),(10,10,16,'P-MVWO4C7K1UYE','PINTURA CELCO COLOR NARANJA','UNI','producto',1.000,150.00,25.0000,150.00),(11,11,1,'P-MVRDG1JQSS4I','PINTURA','UNI','producto',1.000,150.00,75.0000,150.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_venta`
--

LOCK TABLES `detalle_venta` WRITE;
/*!40000 ALTER TABLE `detalle_venta` DISABLE KEYS */;
INSERT INTO `detalle_venta` VALUES (1,1,6,'P-MVVOY3DHW8NG','FORMON/M AMARILLO VICTORY CORTO 3/4',NULL,'UNI','producto',1.000,19.00,0.00,19.00,'2026-10-31 01:18:10'),(2,2,6,'P-MVVOY3DHW8NG','FORMON/M AMARILLO VICTORY CORTO 3/4',NULL,'UNI','producto',1.000,19.00,0.00,19.00,'2026-10-31 01:22:35'),(3,3,5,'P-MVVOY3DGPJPK','FORMON/M AMARILLO VICTORY CORTO 1/4',NULL,'UNI','producto',1.000,15.00,0.00,15.00,'2026-10-31 02:13:37'),(4,4,6,'P-MVVOY3DHW8NG','FORMON/M AMARILLO VICTORY CORTO 3/4',NULL,'UNI','producto',1.000,19.00,0.00,19.00,'2026-10-31 02:40:02'),(5,5,5,'P-MVVOY3DGPJPK','FORMON/M AMARILLO VICTORY CORTO 1/4',NULL,'UNI','producto',1.000,15.00,0.00,15.00,'2026-10-31 16:38:03'),(6,6,6,'P-MVVOY3DHW8NG','FORMON/M AMARILLO VICTORY CORTO 3/4',NULL,'UNI','producto',1.000,19.00,0.00,19.00,'2026-10-31 17:04:21'),(7,7,16,'P-MVWO4C7K1UYE','PINTURA CELCO COLOR NARANJA',NULL,'UNI','producto',1.000,150.00,0.00,150.00,'2026-10-31 17:32:17');
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
INSERT INTO `facturas` VALUES (1,'FAC-2026-000001',1,'Consumidor Final','CF',NULL,NULL,NULL,'2026-10-30','contado',NULL,16.96,2.04,19.00,19.00,0.00,'emitida','pagada','Venta POS VEN-2026-000001',1,'2026-10-31 01:18:10','2026-10-31 01:18:10',NULL,NULL,NULL),(2,'FAC-2026-000002',4,'ALLAN ABDIAS','1234566893',NULL,NULL,'SOLOLA','2026-10-30','contado',NULL,16.96,2.04,19.00,19.00,0.00,'emitida','pagada','Venta POS VEN-2026-000002',1,'2026-10-31 01:22:35','2026-10-31 01:22:35',NULL,NULL,NULL),(3,'FAC-2026-000003',1,'Consumidor Final','CF',NULL,NULL,NULL,'2026-10-30','contado',NULL,13.39,1.61,15.00,15.00,0.00,'emitida','pagada','Venta POS VEN-2026-000003',1,'2026-10-31 02:13:37','2026-10-31 02:13:37',NULL,NULL,NULL),(4,'FAC-2026-000004',1,'Consumidor Final','CF',NULL,NULL,NULL,'2026-10-30','contado',NULL,16.96,2.04,19.00,19.00,0.00,'emitida','pagada','Venta POS VEN-2026-000004',1,'2026-10-31 02:40:02','2026-10-31 02:40:02',NULL,NULL,NULL),(5,'FAC-2026-000005',6,'ALLAN TZOC','12345678',NULL,NULL,'SOLOLA','2026-10-31','contado',NULL,13.39,1.61,15.00,15.00,0.00,'emitida','pagada','Venta POS VEN-2026-000005',1,'2026-10-31 16:38:03','2026-10-31 16:38:03',NULL,NULL,NULL),(6,'FAC-2026-000006',4,'ALLAN ABDIAS','1234566893',NULL,NULL,'SOLOLA','2026-10-31','contado',NULL,26.00,3.12,29.12,29.12,0.00,'anulada','pagada',NULL,1,'2026-10-31 16:45:18','2026-10-31 16:45:35','2026-10-31 16:45:35',1,'CANCELACION'),(7,'FAC-2026-000007',4,'ALLAN ABDIAS','1234566893',NULL,NULL,'SOLOLA','2026-10-31','credito','2026-11-30',26.00,3.12,29.12,29.12,0.00,'emitida','pagada',NULL,1,'2026-10-31 16:46:19','2026-10-31 17:06:18',NULL,NULL,NULL),(8,'FAC-2026-000008',6,'ALLAN TZOC','12345678',NULL,NULL,'SOLOLA','2026-10-31','contado',NULL,16.96,2.04,19.00,19.00,0.00,'emitida','pagada','Venta POS VEN-2026-000006',1,'2026-10-31 17:04:21','2026-10-31 17:04:21',NULL,NULL,NULL),(9,'FAC-2026-000009',4,'ALLAN ABDIAS','1234566893',NULL,NULL,'SOLOLA','2026-10-31','contado',NULL,150.00,18.00,168.00,168.00,0.00,'anulada','pagada',NULL,1,'2026-10-31 17:28:40','2026-10-31 17:29:11','2026-10-31 17:29:11',1,'NO PAGO'),(10,'FAC-2026-000010',7,'Anthony Cuellar','28842718908','77620000','antony@gmail.com','panajachel','2026-10-31','contado',NULL,133.93,16.07,150.00,150.00,0.00,'emitida','pagada','Venta POS VEN-2026-000007',1,'2026-10-31 17:32:17','2026-10-31 17:32:17',NULL,NULL,NULL),(11,'FAC-2026-000011',7,'Anthony Cuellar','28842718908','77620000','antony@gmail.com','panajachel','2026-11-27','credito','2027-01-26',150.00,18.00,168.00,168.00,0.00,'emitida','pagada',NULL,1,'2026-10-31 17:32:59','2026-10-31 17:33:58',NULL,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intentos_login`
--

LOCK TABLES `intentos_login` WRITE;
/*!40000 ALTER TABLE `intentos_login` DISABLE KEYS */;
INSERT INTO `intentos_login` VALUES (1,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-27 20:25:02'),(2,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-28 01:09:34'),(3,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-28 01:41:45'),(4,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-28 15:42:42'),(5,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-30 21:12:42'),(6,'x','::ffff:127.0.0.1',0,'usuario_inexistente','2026-10-30 21:54:26'),(7,'x','::ffff:127.0.0.1',0,'usuario_inexistente','2026-10-30 21:54:43'),(8,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-30 23:28:39'),(9,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-30 23:29:08'),(10,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 00:15:06'),(11,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 00:23:28'),(12,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 00:27:25'),(13,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 00:29:14'),(14,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 00:29:42'),(15,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 00:30:39'),(16,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 00:30:51'),(17,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 00:43:50'),(18,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 00:49:16'),(19,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 01:10:04'),(20,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 16:09:44'),(21,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 16:10:04'),(22,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 16:26:25'),(23,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 16:49:44'),(24,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 16:49:48'),(25,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 16:50:00'),(26,'Andy Shiloj','::ffff:127.0.0.1',1,NULL,'2026-10-31 16:52:10'),(27,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 16:55:18'),(28,'Andy Shiloj','::ffff:127.0.0.1',1,NULL,'2026-10-31 16:57:01'),(29,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 16:57:44'),(30,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 17:01:11'),(31,'Marvin Cuc','::ffff:127.0.0.1',1,NULL,'2026-10-31 17:09:05'),(32,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 17:09:57'),(33,'admin','::ffff:127.0.0.1',1,NULL,'2026-10-31 17:49:51'),(34,'admin','::ffff:127.0.0.1',1,NULL,'2026-11-01 04:22:46'),(35,'admin','::ffff:127.0.0.1',1,NULL,'2026-11-02 18:37:58'),(36,'test.registro.qa','::ffff:127.0.0.1',0,'usuario_inactivo','2026-11-02 18:44:00'),(37,'andy','::ffff:127.0.0.1',0,'usuario_inactivo','2026-11-02 18:48:39'),(38,'admin','::ffff:127.0.0.1',1,NULL,'2026-11-02 18:48:51'),(39,'andy','::ffff:127.0.0.1',1,NULL,'2026-11-02 18:49:45'),(40,'andy','::ffff:127.0.0.1',1,NULL,'2026-11-02 18:52:29'),(41,'admin','::ffff:127.0.0.1',1,NULL,'2026-11-02 18:52:34'),(42,'admin','::ffff:127.0.0.1',1,NULL,'2026-11-02 18:55:08'),(43,'andy','::ffff:127.0.0.1',1,NULL,'2026-11-02 19:01:01'),(44,'admin','::ffff:127.0.0.1',1,NULL,'2026-11-02 19:01:40'),(45,'admin','::ffff:127.0.0.1',0,'password_incorrecta','2026-11-02 19:03:53'),(46,'admin','::ffff:127.0.0.1',0,'password_incorrecta','2026-11-02 19:04:54'),(47,'admin','::ffff:127.0.0.1',1,NULL,'2026-11-03 01:51:18');
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
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES (1,1,'entrada','compra','compras',1,20.000,0.000,20.000,20.000,75.0000,'Entrada por compra C-2026-000001','Entrada por compra C-2026-000001',NULL,NULL,1,'2026-10-28 00:23:52'),(4,4,'entrada','compra','compras',4,2.000,0.000,2.000,2.000,19.2400,'Entrada por compra C-2026-000002','Entrada por compra C-2026-000002',NULL,NULL,1,'2026-10-31 00:56:55'),(5,5,'entrada','compra','compras',4,2.000,0.000,2.000,2.000,10.6000,'Entrada por compra C-2026-000002','Entrada por compra C-2026-000002',NULL,NULL,1,'2026-10-31 00:56:55'),(6,6,'entrada','compra','compras',4,2.000,0.000,2.000,2.000,12.2500,'Entrada por compra C-2026-000002','Entrada por compra C-2026-000002',NULL,NULL,1,'2026-10-31 00:56:55'),(7,7,'entrada','compra','compras',4,2.000,0.000,2.000,2.000,12.8800,'Entrada por compra C-2026-000002','Entrada por compra C-2026-000002',NULL,NULL,1,'2026-10-31 00:56:55'),(8,8,'entrada','compra','compras',4,2.000,0.000,2.000,2.000,17.0200,'Entrada por compra C-2026-000002','Entrada por compra C-2026-000002',NULL,NULL,1,'2026-10-31 00:56:55'),(9,9,'entrada','compra','compras',4,2.000,0.000,2.000,2.000,16.4900,'Entrada por compra C-2026-000002','Entrada por compra C-2026-000002',NULL,NULL,1,'2026-10-31 00:56:55'),(10,6,'salida','','facturas',1,1.000,2.000,1.000,1.000,12.2500,'Salida por venta POS VEN-2026-000001 (FAC-2026-000001)','Venta POS',NULL,NULL,1,'2026-10-31 01:18:10'),(11,6,'salida','','facturas',2,1.000,1.000,0.000,0.000,12.2500,'Salida por venta POS VEN-2026-000002 (FAC-2026-000002)','Venta POS',NULL,NULL,1,'2026-10-31 01:22:35'),(12,5,'salida','','facturas',3,1.000,2.000,1.000,1.000,10.6000,'Salida por venta POS VEN-2026-000003 (FAC-2026-000003)','Venta POS',NULL,NULL,1,'2026-10-31 02:13:37'),(13,6,'entrada','ajuste_positivo',NULL,NULL,10.000,0.000,10.000,10.000,0.0000,NULL,'Compra',NULL,NULL,1,'2026-10-31 02:27:31'),(14,6,'salida','','facturas',4,1.000,10.000,9.000,9.000,12.2500,'Salida por venta POS VEN-2026-000004 (FAC-2026-000004)','Venta POS',NULL,NULL,1,'2026-10-31 02:40:02'),(15,10,'entrada','compra','compras',6,2.000,0.000,2.000,2.000,125.0000,'Entrada por compra C-2026-000003','Entrada por compra C-2026-000003',NULL,NULL,1,'2026-10-31 16:31:54'),(16,11,'entrada','compra','compras',6,5.000,0.000,5.000,5.000,4.4000,'Entrada por compra C-2026-000003','Entrada por compra C-2026-000003',NULL,NULL,1,'2026-10-31 16:31:54'),(17,12,'entrada','compra','compras',6,5.000,0.000,5.000,5.000,5.5000,'Entrada por compra C-2026-000003','Entrada por compra C-2026-000003',NULL,NULL,1,'2026-10-31 16:31:54'),(18,13,'entrada','compra','compras',6,5.000,0.000,5.000,5.000,6.2500,'Entrada por compra C-2026-000003','Entrada por compra C-2026-000003',NULL,NULL,1,'2026-10-31 16:31:54'),(19,14,'entrada','compra','compras',6,5.000,0.000,5.000,5.000,8.0000,'Entrada por compra C-2026-000003','Entrada por compra C-2026-000003',NULL,NULL,1,'2026-10-31 16:31:54'),(20,5,'salida','venta','facturas',5,1.000,1.000,0.000,0.000,10.6000,'Salida por venta POS VEN-2026-000005 (FAC-2026-000005)','Venta POS',NULL,NULL,1,'2026-10-31 16:38:03'),(21,4,'salida','venta','facturas',6,1.000,2.000,1.000,1.000,19.2400,'Salida por factura de venta FAC-2026-000006','Venta',NULL,NULL,1,'2026-10-31 16:45:18'),(22,4,'entrada','anulacion_venta','facturas',6,1.000,1.000,2.000,2.000,19.2400,'Reverso por anulación de factura FAC-2026-000006','Anulación de venta',NULL,NULL,1,'2026-10-31 16:45:35'),(23,4,'salida','venta','facturas',7,1.000,2.000,1.000,1.000,19.2400,'Salida por factura de venta FAC-2026-000007','Venta',NULL,NULL,1,'2026-10-31 16:46:19'),(24,6,'salida','venta','facturas',8,1.000,9.000,8.000,8.000,12.2500,'Salida por venta POS VEN-2026-000006 (FAC-2026-000008)','Venta POS',NULL,NULL,1,'2026-10-31 17:04:21'),(25,15,'entrada','compra','compras',7,25.000,0.000,25.000,25.000,14.7500,'Entrada por compra C-2026-000004','Entrada por compra C-2026-000004',NULL,NULL,1,'2026-10-31 17:15:04'),(26,16,'entrada','compra','compras',8,50.000,0.000,50.000,50.000,25.0000,'Entrada por compra C-2026-000005','Entrada por compra C-2026-000005',NULL,NULL,1,'2026-10-31 17:21:33'),(27,10,'entrada','ajuste_positivo',NULL,NULL,2.000,2.000,4.000,4.000,0.0000,NULL,'Compra','2989','NUEVA COMPRA',1,'2026-10-31 17:27:03'),(28,16,'salida','venta','facturas',9,1.000,50.000,49.000,49.000,25.0000,'Salida por factura de venta FAC-2026-000009','Venta',NULL,NULL,1,'2026-10-31 17:28:40'),(29,16,'entrada','anulacion_venta','facturas',9,1.000,49.000,50.000,50.000,25.0000,'Reverso por anulación de factura FAC-2026-000009','Anulación de venta',NULL,NULL,1,'2026-10-31 17:29:11'),(30,16,'salida','venta','facturas',10,1.000,50.000,49.000,49.000,25.0000,'Salida por venta POS VEN-2026-000007 (FAC-2026-000010)','Venta POS',NULL,NULL,1,'2026-10-31 17:32:17'),(31,1,'salida','venta','facturas',11,1.000,20.000,19.000,19.000,75.0000,'Salida por factura de venta FAC-2026-000011','Venta',NULL,NULL,1,'2026-10-31 17:32:59');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos_compra`
--

LOCK TABLES `pagos_compra` WRITE;
/*!40000 ALTER TABLE `pagos_compra` DISABLE KEYS */;
INSERT INTO `pagos_compra` VALUES (1,1,'2026-10-27',1680.00,'efectivo','Pago automático contado','Compra al contado',1,'activo',NULL,NULL,NULL,'2026-10-28 00:23:52','2026-10-30 21:48:16'),(4,4,'2026-10-29',198.20,'efectivo','Pago automático contado','Compra al contado',1,'activo',NULL,NULL,NULL,'2026-10-31 00:56:55','2026-10-31 00:56:55'),(5,6,'2026-10-31',415.24,'efectivo','Pago automático contado','Compra al contado',1,'activo',NULL,NULL,NULL,'2026-10-31 16:31:54','2026-10-31 16:31:54'),(6,7,'2026-10-31',413.00,'efectivo','Pago automático contado','Compra al contado',1,'activo',NULL,NULL,NULL,'2026-10-31 17:15:04','2026-10-31 17:15:04'),(7,8,'2026-10-31',1400.00,'efectivo',NULL,'PAGO COMPLETO',1,'activo',NULL,NULL,NULL,'2026-10-31 17:22:01','2026-10-31 17:22:01');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES (1,1,'5ba3cc0e35b4959016b24887e5c7e6c1431ad27a7e185808cf67b9125c2af601','2026-10-31 18:18:22',0,'2026-10-31 17:48:22'),(2,1,'eeda41ce38c870e3236fb9d55d0d86d47939c71b519dd89fd9c609752bc86390','2026-11-02 19:05:49',1,'2026-11-02 18:35:49');
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
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
INSERT INTO `permisos` VALUES (1,'inventario.productos.ver','Ver productos','Consultar el catálogo y existencias de productos.','inventario',1,'2026-10-25 16:51:02'),(2,'inventario.productos.ver_costos','Ver costos de productos','Consultar costo último, costo promedio y valor del inventario.','inventario',1,'2026-10-25 16:51:02'),(3,'inventario.productos.crear','Crear productos','Registrar productos nuevos.','inventario',1,'2026-10-25 16:51:02'),(4,'inventario.productos.editar','Editar productos','Modificar datos de productos sin alterar existencias.','inventario',1,'2026-10-25 16:51:02'),(5,'inventario.productos.eliminar','Eliminar productos','Eliminar productos sin compras, órdenes ni movimientos distintos al inventario inicial.','inventario',1,'2026-10-25 16:51:02'),(6,'inventario.categorias.ver','Ver categorías','Consultar las categorías de inventario.','inventario',1,'2026-10-25 16:51:02'),(7,'inventario.categorias.crear','Crear categorías','Registrar categorías de inventario.','inventario',1,'2026-10-25 16:51:02'),(8,'inventario.categorias.editar','Editar categorías','Modificar categorías de inventario.','inventario',1,'2026-10-25 16:51:02'),(9,'inventario.categorias.eliminar','Eliminar categorías','Eliminar categorías sin productos asociados.','inventario',1,'2026-10-25 16:51:02'),(10,'inventario.movimientos.ver','Ver movimientos','Consultar el historial de entradas y salidas.','inventario',1,'2026-10-25 16:51:02'),(11,'inventario.movimientos.ajustar','Ajustar inventario','Registrar ajustes positivos o negativos con motivo.','inventario',1,'2026-10-25 16:51:02'),(12,'inventario.reporte.ver','Ver reporte de inventario','Consultar el reporte valorizado y sus indicadores.','inventario',1,'2026-10-25 16:51:02'),(13,'inventario.reporte.exportar','Exportar reporte de inventario','Descargar el reporte en CSV, Excel o PDF.','inventario',1,'2026-10-25 16:51:02'),(14,'facturacion.clientes.ver','Ver clientes','Consultar el catálogo y el saldo de los clientes.','facturacion',1,'2026-10-25 16:51:02'),(15,'facturacion.clientes.crear','Crear clientes','Registrar clientes para facturación.','facturacion',1,'2026-10-25 16:51:02'),(16,'facturacion.clientes.editar','Editar clientes','Modificar datos y estado de los clientes.','facturacion',1,'2026-10-25 16:51:02'),(17,'facturacion.facturas.ver','Ver facturas','Consultar facturas emitidas y sus detalles.','facturacion',1,'2026-10-25 16:51:02'),(18,'facturacion.facturas.crear','Crear facturas','Emitir facturas y descontar inventario.','facturacion',1,'2026-10-25 16:51:02'),(19,'facturacion.facturas.anular','Anular facturas','Anular facturas y devolver el inventario.','facturacion',1,'2026-10-25 16:51:02'),(20,'facturacion.cobros.ver','Ver cobros','Consultar cuentas por cobrar e historial de cobros.','facturacion',1,'2026-10-25 16:51:02'),(21,'facturacion.cobros.registrar','Registrar cobros','Aplicar pagos a las facturas.','facturacion',1,'2026-10-25 16:51:02'),(22,'facturacion.cobros.anular','Anular cobros','Anular cobros aplicados a facturas.','facturacion',1,'2026-10-25 16:51:02'),(23,'facturacion.reporte.ver','Ver reporte de facturación','Consultar indicadores y reportes de facturación.','facturacion',1,'2026-10-25 16:51:02'),(24,'facturacion.reporte.exportar','Exportar reporte de facturación','Descargar el reporte de facturación en CSV o PDF.','facturacion',1,'2026-10-25 16:51:02'),(25,'facturacion.cobros.devolver','Registrar devoluciones','Registrar devoluciones parciales de ventas y devolver inventario.','facturacion',1,'2026-10-25 16:51:03'),(26,'seguridad.auditoria.ver','Ver auditoría','Consultar el registro de acciones sensibles del sistema.','seguridad',1,'2026-10-25 16:51:03'),(104,'reportes.general.ver','Ver Reporte General','Acceder al dashboard de indicadores generales del sistema.','reportes',1,'2026-10-31 16:14:17');
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
INSERT INTO `permisos_rol` VALUES (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),(1,21),(1,22),(1,23),(1,24),(1,25),(1,26),(1,104),(2,1),(2,14),(2,15),(2,16),(2,17),(2,18),(2,20),(2,21),(2,23),(2,24),(2,25),(3,1),(3,2),(3,3),(3,4),(3,6),(3,10),(3,11),(3,12),(3,13),(4,1),(4,14),(4,15),(4,16),(4,17),(4,20),(4,21),(4,23),(4,24),(4,25),(5,1),(6,1),(6,2),(6,3),(6,4),(6,6),(6,10),(6,12),(6,13);
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto_proveedor`
--

LOCK TABLES `producto_proveedor` WRITE;
/*!40000 ALTER TABLE `producto_proveedor` DISABLE KEYS */;
INSERT INTO `producto_proveedor` VALUES (1,1,1,75.0000,0,'2026-10-28 00:23:52','2026-10-28 00:23:52'),(4,4,2,19.2400,0,'2026-10-31 00:56:55','2026-10-31 00:56:55'),(5,5,2,10.6000,0,'2026-10-31 00:56:55','2026-10-31 00:56:55'),(6,6,2,12.2500,0,'2026-10-31 00:56:55','2026-10-31 00:56:55'),(7,7,2,12.8800,0,'2026-10-31 00:56:55','2026-10-31 00:56:55'),(8,8,2,17.0200,0,'2026-10-31 00:56:55','2026-10-31 00:56:55'),(9,9,2,16.4900,0,'2026-10-31 00:56:55','2026-10-31 00:56:55'),(10,10,4,125.0000,0,'2026-10-31 16:31:54','2026-10-31 16:31:54'),(11,11,4,4.4000,0,'2026-10-31 16:31:54','2026-10-31 16:31:54'),(12,12,4,5.5000,0,'2026-10-31 16:31:54','2026-10-31 16:31:54'),(13,13,4,6.2500,0,'2026-10-31 16:31:54','2026-10-31 16:31:54'),(14,14,4,8.0000,0,'2026-10-31 16:31:54','2026-10-31 16:31:54'),(15,15,5,14.7500,0,'2026-10-31 17:15:04','2026-10-31 17:15:04'),(16,16,1,25.0000,0,'2026-10-31 17:21:33','2026-10-31 17:21:33');
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'P-MVRDG1JQSS4I',NULL,'PINTURA',NULL,NULL,NULL,NULL,NULL,1,'producto',NULL,NULL,'UNI',19.000,0.000,75.0000,75.0000,150.00,1,'2026-10-28 00:23:52','2026-10-31 17:32:59'),(4,'P-MVVOY3DD7QRX',NULL,'FORMON /M AZUL VICTORY 38mm',NULL,NULL,NULL,NULL,NULL,2,'producto',NULL,NULL,'UNI',1.000,0.000,19.2400,19.2400,26.00,1,'2026-10-31 00:56:55','2026-10-31 16:46:19'),(5,'P-MVVOY3DGPJPK','A950','FORMON/M AMARILLO VICTORY CORTO 1/4',NULL,'producto-5-1793411675110-b146aded9744.webp','producto-5-1793411675110-b146aded9744-min.webp','image/webp',11,2,'producto',NULL,NULL,'UNI',0.000,0.000,10.6000,10.6000,15.00,0,'2026-10-31 00:56:55','2026-10-31 17:19:12'),(6,'P-MVVOY3DHW8NG','A957','FORMON/M AMARILLO VICTORY CORTO 3/4',NULL,'producto-6-1793409174213-47ed9c6f47b5.webp','producto-6-1793409174213-47ed9c6f47b5-min.webp','image/webp',11,2,'producto',NULL,NULL,'UNI',8.000,0.000,12.2500,12.2500,19.00,1,'2026-10-31 00:56:55','2026-10-31 17:18:34'),(7,'P-MVVOY3DLDRO0',NULL,'FOMON M/ AMARILLO VICTORY CORTO 1',NULL,NULL,NULL,NULL,NULL,2,'producto',NULL,NULL,'UNI',2.000,0.000,12.8800,12.8800,19.00,1,'2026-10-31 00:56:55','2026-10-31 00:56:55'),(8,'P-MVVOY3DLOTTE',NULL,'FORMON M/AMARILLO VICTORY CORTO 1-1/2',NULL,NULL,NULL,NULL,NULL,2,'producto',NULL,NULL,'UNI',2.000,0.000,17.0200,17.0200,24.00,1,'2026-10-31 00:56:55','2026-10-31 00:56:55'),(9,'P-MVVOY3DMAY5H',NULL,'FORMON M/AMARILLO VICTORY CORTO 1-1/4',NULL,NULL,NULL,NULL,NULL,2,'producto',NULL,NULL,'UNI',2.000,0.000,16.4900,16.4900,22.00,1,'2026-10-31 00:56:55','2026-10-31 00:56:55'),(10,'P-MVWMCI08RGS2',NULL,'BALANZA DE MOSTRADOR CADENA 44 LBS.20 KGS',NULL,NULL,NULL,NULL,NULL,4,'producto',NULL,NULL,'UNI',4.000,0.000,125.0000,125.0000,150.00,1,'2026-10-31 16:31:54','2026-10-31 17:27:03'),(11,'P-MVWMCI0BEARL',NULL,'BROCHA MANGO PLASTICO PELO COLOR MIXTO MARCA CAIMAN 1 1/2',NULL,NULL,NULL,NULL,NULL,4,'producto',NULL,NULL,'UNI',5.000,0.000,4.4000,4.4000,8.00,1,'2026-10-31 16:31:54','2026-10-31 16:31:54'),(12,'P-MVWMCI0DTC4R',NULL,'BROCHA MANGO PLASTICO PELO COLOR MIXTO MARCA MARCA CAIMAN 2',NULL,'producto-12-1793464473414-1699354eacf0.webp','producto-12-1793464473414-1699354eacf0-min.webp','image/webp',NULL,4,'producto',NULL,NULL,'UNI',5.000,0.000,5.5000,5.5000,10.00,1,'2026-10-31 16:31:54','2026-10-31 16:34:33'),(13,'P-MVWMCI0JD6HT',NULL,'BROCHA MANGO PLASTICO PELO COLOR MIXTO MARCA CAIMAN 2 1/2',NULL,NULL,NULL,NULL,NULL,4,'producto',NULL,NULL,'UNI',5.000,0.000,6.2500,6.2500,12.00,1,'2026-10-31 16:31:54','2026-10-31 16:31:54'),(14,'P-MVWMCI0KWWKQ',NULL,'BROCHA MANGO PLASTICO PELO COLOR MIXTO MARCA CAIMAN 3',NULL,NULL,NULL,NULL,NULL,4,'producto',NULL,NULL,'UNI',5.000,0.000,8.0000,8.0000,13.00,1,'2026-10-31 16:31:54','2026-10-31 16:31:54'),(15,'P-MVWNVZY7I4NZ',NULL,'WIPE BLANCO L.B',NULL,NULL,NULL,NULL,NULL,5,'producto',NULL,NULL,'UNI',25.000,0.000,14.7500,14.7500,15.00,1,'2026-10-31 17:15:04','2026-10-31 17:15:04'),(16,'P-MVWO4C7K1UYE',NULL,'PINTURA CELCO COLOR NARANJA',NULL,'producto-16-1793467357448-08d590ee2e8e.webp','producto-16-1793467357448-08d590ee2e8e-min.webp','image/webp',3,1,'producto',NULL,NULL,'UNI',49.000,0.000,25.0000,25.0000,150.00,1,'2026-10-31 17:21:33','2026-10-31 17:32:17');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES (1,'CELCO','28912092','1234567891012','7762-0022','7762-0000',NULL,'celcoguatemala@gmail.com','ZONA 1 CIUDAD GUATEMALA',0,NULL,1,'2026-10-27 23:13:41','2026-10-31 17:12:15'),(2,'DIDISA',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,1,'2026-10-31 00:50:57','2026-10-31 17:12:33'),(4,'EL PACIFICO',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,1,'2026-10-31 16:29:17','2026-10-31 16:29:17'),(5,'DISTRIBUIDORA Y FERRETERIA ASTURIAS','123345678','1234612541221','77620000',NULL,NULL,'distribuidora@gmail.com',NULL,0,NULL,1,'2026-10-31 17:13:46','2026-10-31 17:13:46');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
-- Table structure for table `ruta_paradas`
--

DROP TABLE IF EXISTS `ruta_paradas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ruta_paradas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ruta_id` int(11) NOT NULL,
  `despacho_id` int(11) NOT NULL,
  `orden` int(11) NOT NULL DEFAULT 0,
  `estado_parada` enum('pendiente','revisado','entregado','entrega_parcial','fallido') DEFAULT 'pendiente',
  `hora_entrega` datetime DEFAULT NULL,
  `recibido_por` varchar(100) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `motivo_fallo` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ruta_paradas_ruta` (`ruta_id`,`orden`),
  KEY `idx_ruta_paradas_despacho` (`despacho_id`),
  CONSTRAINT `fk_ruta_paradas_despacho` FOREIGN KEY (`despacho_id`) REFERENCES `despachos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ruta_paradas_ruta` FOREIGN KEY (`ruta_id`) REFERENCES `rutas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ruta_paradas`
--

LOCK TABLES `ruta_paradas` WRITE;
/*!40000 ALTER TABLE `ruta_paradas` DISABLE KEYS */;
INSERT INTO `ruta_paradas` VALUES (1,1,1,1,'pendiente',NULL,NULL,NULL,NULL,'2026-10-31 16:15:55'),(2,2,3,1,'pendiente',NULL,NULL,NULL,NULL,'2026-10-31 17:37:37');
/*!40000 ALTER TABLE `ruta_paradas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rutas`
--

DROP TABLE IF EXISTS `rutas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rutas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) DEFAULT NULL,
  `fecha` date NOT NULL,
  `conductor_id` int(11) DEFAULT NULL,
  `vehiculo_id` int(11) DEFAULT NULL,
  `zona` varchar(100) DEFAULT NULL,
  `estado` enum('planificada','en_curso','finalizada','cancelada') NOT NULL DEFAULT 'planificada',
  `usuario_id` int(11) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rutas_codigo` (`codigo`),
  KEY `idx_rutas_estado` (`estado`),
  KEY `idx_rutas_fecha` (`fecha`),
  KEY `idx_rutas_conductor` (`conductor_id`),
  KEY `idx_rutas_vehiculo` (`vehiculo_id`),
  KEY `fk_rutas_usuario` (`usuario_id`),
  CONSTRAINT `fk_rutas_conductor` FOREIGN KEY (`conductor_id`) REFERENCES `conductores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rutas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rutas_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rutas`
--

LOCK TABLES `rutas` WRITE;
/*!40000 ALTER TABLE `rutas` DISABLE KEYS */;
INSERT INTO `rutas` VALUES (1,'RTA-000001','2026-10-31',1,1,NULL,'cancelada',NULL,'2026-10-31 16:15:55','2026-10-31 17:37:59'),(2,'RTA-000002','2026-11-07',1,1,'zona 2 san lucas toliman','en_curso',NULL,'2026-10-31 17:37:37','2026-10-31 17:37:44');
/*!40000 ALTER TABLE `rutas` ENABLE KEYS */;
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
INSERT INTO `secuencias` VALUES ('compras',2026,5,'2026-10-31 17:21:33'),('facturas',2026,11,'2026-10-31 17:32:59'),('ventas_pos',2026,7,'2026-10-31 17:32:17');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesiones_caja`
--

LOCK TABLES `sesiones_caja` WRITE;
/*!40000 ALTER TABLE `sesiones_caja` DISABLE KEYS */;
INSERT INTO `sesiones_caja` VALUES (1,1,'cerrada',100.00,'2026-10-30 21:15:04','2026-10-31 16:10:55',72.00,72.00,0.00,0.00,4,0.00,0.00,0.00,0.00,0,0.00,0.00,0.00,0.00,0,'[{\"denominacion\":200,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":100,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":50,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":20,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":10,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":5,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":1,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.5,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.25,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.1,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.05,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.01,\"cantidad\":0,\"subtotal\":0}]',0.00,0.00,172.00,0.00,-172.00,NULL,'2026-10-30 21:15:04','2026-10-31 16:10:55'),(2,1,'cerrada',100.00,'2026-10-31 16:36:17','2026-10-31 17:01:47',15.00,15.00,0.00,0.00,1,0.00,0.00,0.00,0.00,0,0.00,0.00,0.00,0.00,0,'[{\"denominacion\":200,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":100,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":50,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":20,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":10,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":5,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":1,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.5,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.25,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.1,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.05,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.01,\"cantidad\":0,\"subtotal\":0}]',0.00,0.00,115.00,0.00,-115.00,NULL,'2026-10-31 16:36:17','2026-10-31 17:01:47'),(3,1,'cerrada',100.00,'2026-10-31 17:02:05','2026-11-02 19:04:13',169.00,169.00,0.00,0.00,2,197.12,197.12,0.00,0.00,2,0.00,0.00,0.00,0.00,0,'[{\"denominacion\":200,\"cantidad\":2,\"subtotal\":400},{\"denominacion\":100,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":50,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":20,\"cantidad\":3,\"subtotal\":60},{\"denominacion\":10,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":5,\"cantidad\":1,\"subtotal\":5},{\"denominacion\":1,\"cantidad\":1,\"subtotal\":1},{\"denominacion\":0.5,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.25,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.1,\"cantidad\":1,\"subtotal\":0.1},{\"denominacion\":0.05,\"cantidad\":0,\"subtotal\":0},{\"denominacion\":0.01,\"cantidad\":2,\"subtotal\":0.02}]',0.00,0.00,466.12,466.12,0.00,NULL,'2026-10-31 17:02:05','2026-11-02 19:04:13'),(4,1,'abierta',100.00,'2026-11-02 19:04:17',NULL,0.00,0.00,0.00,0.00,0,0.00,0.00,0.00,0.00,0,0.00,0.00,0.00,0.00,0,NULL,NULL,NULL,0.00,NULL,NULL,NULL,'2026-11-02 19:04:17','2026-11-02 19:04:17');
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
INSERT INTO `usuario_roles` VALUES (1,1),(2,1),(4,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador','anthony1131cuellar@gmail.com',NULL,'ADM-001','admin',NULL,'perfil-1-1793468787905-8fdb8dec7864.webp','image/webp','$2a$10$LYfvsrUFMy9QzGworcsSwu0D3.QluncztWz2BA/cInwc6d0k3GCQ.','admin',NULL,1,'2026-10-25 16:51:10','2026-11-02 18:37:49'),(2,'Allan Abdias',NULL,'Bocel Shiloj','ADM-002','Allan Shiloj',NULL,NULL,NULL,'$2a$10$1gWg7.ER2wJTqRKEOeeIfOL5B7X8ACt/L2KSnIp5jlftVetI0Cl5u','administrador',6,1,'2026-10-30 21:52:48','2026-10-30 21:52:48'),(4,'Anthony',NULL,'Cuellar','ADM-004','ANTHONY CUELLAR',NULL,NULL,NULL,'$2a$10$cCnObgPORVO7yoNzzYnKSe57blX6hROLFAuNQbDJ2lWKuCODCnzTe','administrador',6,1,'2026-10-31 16:55:52','2026-10-31 16:55:52'),(8,'andy','acuellard@miumg.edu.gt','tzoc',NULL,'andy',NULL,NULL,NULL,'$2a$10$Ca7Ng0awFgyLE8o30d0tnu62LqfeLJCQs0k4P/CUMvkLyvcSgQDc2','pendiente',NULL,1,'2026-11-02 18:54:56','2026-11-02 19:00:14');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculos`
--

DROP TABLE IF EXISTS `vehiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vehiculos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `placa` varchar(20) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `placa` (`placa`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculos`
--

LOCK TABLES `vehiculos` WRITE;
/*!40000 ALTER TABLE `vehiculos` DISABLE KEYS */;
INSERT INTO `vehiculos` VALUES (1,'P-2245-RT','Toyota Hilux — caja 10 pies',1,'2026-10-31 16:14:17'),(2,'P-8891-KM','Mitsubishi L200 — caja 12 pies',1,'2026-10-31 16:14:17');
/*!40000 ALTER TABLE `vehiculos` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (1,'VEN-2026-000001',1,1,1,1,16.96,2.04,0.00,19.00,'efectivo',19.00,0.00,NULL,'completada',NULL,NULL,NULL,NULL,'2026-10-31 01:18:10','2026-10-31 01:18:10'),(2,'VEN-2026-000002',1,2,4,1,16.96,2.04,0.00,19.00,'efectivo',19.00,0.00,NULL,'completada',NULL,NULL,NULL,NULL,'2026-10-31 01:22:35','2026-10-31 01:22:35'),(3,'VEN-2026-000003',1,3,1,1,13.39,1.61,0.00,15.00,'efectivo',15.00,0.00,NULL,'completada',NULL,NULL,NULL,NULL,'2026-10-31 02:13:37','2026-10-31 02:13:37'),(4,'VEN-2026-000004',1,4,1,1,16.96,2.04,0.00,19.00,'efectivo',19.00,0.00,NULL,'completada',NULL,NULL,NULL,NULL,'2026-10-31 02:40:02','2026-10-31 02:40:02'),(5,'VEN-2026-000005',2,5,6,1,13.39,1.61,0.00,15.00,'efectivo',15.00,0.00,NULL,'completada',NULL,NULL,NULL,NULL,'2026-10-31 16:38:03','2026-10-31 16:38:03'),(6,'VEN-2026-000006',3,8,6,1,16.96,2.04,0.00,19.00,'efectivo',19.00,0.00,NULL,'completada',NULL,NULL,NULL,NULL,'2026-10-31 17:04:21','2026-10-31 17:04:21'),(7,'VEN-2026-000007',3,10,7,1,133.93,16.07,0.00,150.00,'efectivo',150.00,0.00,NULL,'completada',NULL,NULL,NULL,NULL,'2026-10-31 17:32:17','2026-10-31 17:32:17');
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

-- Dump completed on 2026-11-02 20:08:14
