-- Ejecutar esto en MySQL (Workbench, phpMyAdmin, o cliente de línea de comandos)

CREATE DATABASE IF NOT EXISTS sgifep_ferreteria
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sgifep_ferreteria;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'ventas',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles esperados por modulos.html: administrador, admin, ventas, bodega, reparto, caja
-- No insertes usuarios aquí con contraseña en texto plano.
-- Usá seed.js (incluido) para crear el primer usuario con la contraseña ya encriptada.
