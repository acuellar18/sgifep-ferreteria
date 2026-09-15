const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');

// Convierte el GROUP_CONCAT 'id::nombre|id::nombre' en un arreglo de roles
function parseRoles(roleStr) {
    if (!roleStr) return [];
    return roleStr
        .split('|')
        .filter(Boolean)
        .map((part) => {
            const [idStr, ...nombre] = part.split('::');
            return { id: Number(idStr), nombre: nombre.join('::') };
        });
}

// Valida que el departamento exista y esté activo
async function validarDepartamento(conn, departamentoId) {
    if (!departamentoId) return true;
    const [rows] = await conn.query(
        'SELECT id FROM departamentos WHERE id = ? AND activo = 1',
        [departamentoId]
    );
    return rows.length > 0;
}

// Valida los roles: deben existir, estar activos y devuelve los id válidos
async function validarRoles(conn, roles) {
    const ids = [...new Set((roles || []).map(Number).filter((n) => Number.isInteger(n)))];
    if (roles && roles.length > 0 && ids.length === 0) return { ok: false, ids: [] };
    if (ids.length === 0) return { ok: true, ids: [] };

    const [rows] = await conn.query(
        'SELECT id FROM roles WHERE id IN (?) AND activo = 1',
        [ids]
    );
    const validos = rows.map((r) => r.id);
    return { ok: validos.length === ids.length, ids: validos };
}

// Obtiene el nombre del primer rol para la columna heredada `usuarios.rol`
async function rolLegacy(ids) {
    if (!ids.length) return 'admin';
    const [rows] = await pool.query('SELECT nombre FROM roles WHERE id = ? LIMIT 1', [ids[0]]);
    return rows.length ? rows[0].nombre : 'admin';
}

// GET /api/usuarios?q=&estado=&fechaInicio=&fechaFin=&departamento=&rol=
router.get('/', async (req, res) => {
    try {
        const { q, estado, fechaInicio, fechaFin, departamento, rol } = req.query;

        const where = [];
        const params = [];

        if (q) {
            where.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.codigo LIKE ? OR u.username LIKE ?)');
            const like = `%${q}%`;
            params.push(like, like, like, like);
        }
        if (estado === 'activo') {
            where.push('u.activo = 1');
        } else if (estado === 'inactivo') {
            where.push('u.activo = 0');
        }
        if (fechaInicio) {
            where.push('DATE(u.creado_en) >= ?');
            params.push(fechaInicio);
        }
        if (fechaFin) {
            where.push('DATE(u.creado_en) <= ?');
            params.push(fechaFin);
        }
        if (departamento) {
            where.push('u.departamento_id = ?');
            params.push(Number(departamento));
        }
        if (rol) {
            where.push('ur.rol_id = ?');
            params.push(Number(rol));
        }

        const sql = `
            SELECT u.id, u.nombre, u.apellido, u.codigo, u.username,
                   u.rol, u.departamento_id, u.activo, u.creado_en, u.actualizado_en,
                   d.nombre AS departamento_nombre,
                   COALESCE(GROUP_CONCAT(DISTINCT CONCAT(r.id, '::', r.nombre) ORDER BY r.id SEPARATOR '|'), '') AS roles
            FROM usuarios u
            LEFT JOIN departamentos d ON d.id = u.departamento_id
            LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
            LEFT JOIN roles r ON r.id = ur.rol_id
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            GROUP BY u.id
            ORDER BY u.id DESC`;

        const [rows] = await pool.query(sql, params);
        const data = rows.map((row) => ({
            id: row.id,
            nombre: row.nombre,
            apellido: row.apellido,
            codigo: row.codigo,
            username: row.username,
            rol: row.rol,
            departamento_id: row.departamento_id,
            departamento_nombre: row.departamento_nombre,
            activo: Boolean(row.activo),
            creado_en: row.creado_en,
            actualizado_en: row.actualizado_en,
            roles: parseRoles(row.roles)
        }));
        res.json({ success: true, data });
    } catch (err) {
        console.error('Error en GET /api/usuarios:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// GET /api/usuarios/reporte  (definida ANTES de /:id para no chocar con el parámetro)
router.get('/reporte', async (req, res) => {
    try {
        const [totales] = await pool.query(`
            SELECT COUNT(*) AS total,
                   SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos,
                   SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) AS inactivos
            FROM usuarios`);

        const [porDepartamento] = await pool.query(`
            SELECT d.id, d.nombre, COUNT(u.id) AS total_activos
            FROM departamentos d
            LEFT JOIN usuarios u ON u.departamento_id = d.id AND u.activo = 1
            GROUP BY d.id, d.nombre
            ORDER BY d.nombre ASC`);

        const [porRol] = await pool.query(`
            SELECT r.id, r.nombre, r.acceso_total, COUNT(DISTINCT u.id) AS total_activos
            FROM roles r
            LEFT JOIN usuario_roles ur ON ur.rol_id = r.id
            LEFT JOIN usuarios u ON u.id = ur.usuario_id AND u.activo = 1
            GROUP BY r.id, r.nombre, r.acceso_total
            ORDER BY r.acceso_total DESC, r.nombre ASC`);

        res.json({
            success: true,
            data: {
                totales: {
                    total: Number(totales[0].total) || 0,
                    activos: Number(totales[0].activos) || 0,
                    inactivos: Number(totales[0].inactivos) || 0
                },
                porDepartamento,
                porRol
            }
        });
    } catch (err) {
        console.error('Error en GET /api/usuarios/reporte:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// GET /api/usuarios/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.id, u.nombre, u.apellido, u.codigo, u.username, u.rol,
                    u.departamento_id, u.activo, u.creado_en, u.actualizado_en,
                    d.nombre AS departamento_nombre,
                    COALESCE(GROUP_CONCAT(DISTINCT CONCAT(r.id, '::', r.nombre) ORDER BY r.id SEPARATOR '|'), '') AS roles
             FROM usuarios u
             LEFT JOIN departamentos d ON d.id = u.departamento_id
             LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
             LEFT JOIN roles r ON r.id = ur.rol_id
             WHERE u.id = ?
             GROUP BY u.id`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
        }
        const row = rows[0];
        res.json({
            success: true,
            data: {
                id: row.id,
                nombre: row.nombre,
                apellido: row.apellido,
                codigo: row.codigo,
                username: row.username,
                rol: row.rol,
                departamento_id: row.departamento_id,
                departamento_nombre: row.departamento_nombre,
                activo: Boolean(row.activo),
                creado_en: row.creado_en,
                actualizado_en: row.actualizado_en,
                roles: parseRoles(row.roles)
            }
        });
    } catch (err) {
        console.error('Error en GET /api/usuarios/:id:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// POST /api/usuarios  (crea usuario + asigna roles, con transacción)
router.post('/', async (req, res) => {
    const { nombre, apellido, codigo, username, password, departamento_id, roles, activo } = req.body;

    if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({ success: false, mensaje: 'El nombre es requerido' });
    }
    if (!username || !String(username).trim()) {
        return res.status(400).json({ success: false, mensaje: 'El nombre de usuario es requerido' });
    }
    if (!codigo || !String(codigo).trim()) {
        return res.status(400).json({ success: false, mensaje: 'El código es requerido' });
    }
    if (!password) {
        return res.status(400).json({ success: false, mensaje: 'La contraseña es requerida' });
    }

    try {
        // Pre-checks fuera de la transacción (lecturas de validación)
        const [duplicadoUsername] = await pool.query(
            'SELECT id FROM usuarios WHERE username = ? LIMIT 1',
            [String(username).trim()]
        );
        if (duplicadoUsername.length > 0) {
            return res.status(409).json({ success: false, mensaje: 'Ya existe un usuario con ese nombre de usuario' });
        }

        const [duplicadoCodigo] = await pool.query(
            'SELECT id FROM usuarios WHERE codigo = ? LIMIT 1',
            [String(codigo).trim()]
        );
        if (duplicadoCodigo.length > 0) {
            return res.status(409).json({ success: false, mensaje: 'Ya existe un usuario con ese código' });
        }

        const deptoOk = await validarDepartamento(pool, departamento_id);
        if (departamento_id && !deptoOk) {
            return res.status(400).json({ success: false, mensaje: 'El departamento indicado no existe o está inactivo' });
        }

        const validacionRoles = await validarRoles(pool, roles);
        if (!validacionRoles.ok) {
            return res.status(400).json({ success: false, mensaje: 'Uno o más roles no existen o están inactivos' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const rol = await rolLegacy(validacionRoles.ids);

        // Transacción solo para las escrituras
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO usuarios (nombre, apellido, codigo, username, password_hash, rol, departamento_id, activo)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    String(nombre).trim(),
                    apellido ? String(apellido).trim() : null,
                    String(codigo).trim(),
                    String(username).trim(),
                    passwordHash,
                    rol,
                    departamento_id || null,
                    activo === undefined ? 1 : (activo ? 1 : 0)
                ]
            );

            for (const rolId of validacionRoles.ids) {
                await connection.query(
                    'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)',
                    [result.insertId, rolId]
                );
            }

            await connection.commit();
            res.status(201).json({ success: true, mensaje: 'Usuario creado correctamente', data: { id: result.insertId } });
        } catch (err) {
            await connection.rollback();
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, mensaje: 'El código o nombre de usuario ya está en uso' });
            }
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error en POST /api/usuarios:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// PUT /api/usuarios/:id  (edita datos y reasigna roles, con transacción)
router.put('/:id', async (req, res) => {
    const { nombre, apellido, codigo, username, password, departamento_id, roles, activo } = req.body;

    if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({ success: false, mensaje: 'El nombre es requerido' });
    }
    if (!username || !String(username).trim()) {
        return res.status(400).json({ success: false, mensaje: 'El nombre de usuario es requerido' });
    }
    if (!codigo || !String(codigo).trim()) {
        return res.status(400).json({ success: false, mensaje: 'El código es requerido' });
    }

    try {
        // Pre-checks fuera de la transacción
        const [existe] = await pool.query('SELECT id, password_hash FROM usuarios WHERE id = ?', [req.params.id]);
        if (existe.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
        }

        const [duplicadoUsername] = await pool.query(
            'SELECT id FROM usuarios WHERE username = ? AND id <> ? LIMIT 1',
            [String(username).trim(), req.params.id]
        );
        if (duplicadoUsername.length > 0) {
            return res.status(409).json({ success: false, mensaje: 'Ya existe un usuario con ese nombre de usuario' });
        }

        const [duplicadoCodigo] = await pool.query(
            'SELECT id FROM usuarios WHERE codigo = ? AND id <> ? LIMIT 1',
            [String(codigo).trim(), req.params.id]
        );
        if (duplicadoCodigo.length > 0) {
            return res.status(409).json({ success: false, mensaje: 'Ya existe un usuario con ese código' });
        }

        const deptoOk = await validarDepartamento(pool, departamento_id);
        if (departamento_id && !deptoOk) {
            return res.status(400).json({ success: false, mensaje: 'El departamento indicado no existe o está inactivo' });
        }

        const validacionRoles = await validarRoles(pool, roles);
        if (!validacionRoles.ok) {
            return res.status(400).json({ success: false, mensaje: 'Uno o más roles no existen o están inactivos' });
        }

        let passwordHash = existe[0].password_hash;
        if (password !== undefined && password !== null && String(password).length > 0) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        const rol = await rolLegacy(validacionRoles.ids);

        // Transacción solo para las escrituras
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(
                `UPDATE usuarios
                 SET nombre = ?, apellido = ?, codigo = ?, username = ?, password_hash = ?,
                     rol = ?, departamento_id = ?, activo = ?
                 WHERE id = ?`,
                [
                    String(nombre).trim(),
                    apellido ? String(apellido).trim() : null,
                    String(codigo).trim(),
                    String(username).trim(),
                    passwordHash,
                    rol,
                    departamento_id || null,
                    activo === undefined ? 1 : (activo ? 1 : 0),
                    req.params.id
                ]
            );

            await connection.query('DELETE FROM usuario_roles WHERE usuario_id = ?', [req.params.id]);
            for (const rolId of validacionRoles.ids) {
                await connection.query(
                    'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)',
                    [req.params.id, rolId]
                );
            }

            await connection.commit();
            res.json({ success: true, mensaje: 'Usuario actualizado correctamente' });
        } catch (err) {
            await connection.rollback();
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, mensaje: 'El código o nombre de usuario ya está en uso' });
            }
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error en PUT /api/usuarios/:id:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// PATCH /api/usuarios/:id/estado  (activa/inactiva, baja lógica)
router.patch('/:id/estado', async (req, res) => {
    const activo = Number(req.body.activo);

    if (activo !== 0 && activo !== 1) {
        return res.status(400).json({ success: false, mensaje: 'El campo activo debe ser 0 o 1' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE usuarios SET activo = ? WHERE id = ?',
            [activo, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
        }
        res.json({ success: true, mensaje: activo ? 'Usuario activado' : 'Usuario inactivado' });
    } catch (err) {
        console.error('Error en PATCH /api/usuarios/:id/estado:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// DELETE /api/usuarios/:id  (baja física, usar con cuidado)
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
        }
        res.json({ success: true, mensaje: 'Usuario eliminado correctamente' });
    } catch (err) {
        console.error('Error en DELETE /api/usuarios/:id:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

module.exports = router;