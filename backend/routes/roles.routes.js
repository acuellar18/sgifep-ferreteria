const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/roles?estado=activo|inactivo|todos
router.get('/', async (req, res) => {
    try {
        const est = req.query.estado || 'todos';
        const where = [];
        const params = [];
        if (est === 'activo') {
            where.push('r.activo = 1');
        } else if (est === 'inactivo') {
            where.push('r.activo = 0');
        }
        const sql = `
            SELECT r.id, r.nombre, r.descripcion, r.acceso_total, r.activo, r.creado_en,
                   COUNT(DISTINCT ur.usuario_id) AS numero_usuarios
            FROM roles r
            LEFT JOIN usuario_roles ur ON ur.rol_id = r.id
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            GROUP BY r.id
            ORDER BY r.acceso_total DESC, r.nombre ASC`;

        const [rows] = await pool.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error en GET /api/roles:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// GET /api/roles/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, nombre, descripcion, acceso_total, activo, creado_en FROM roles WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Rol no encontrado' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error en GET /api/roles/:id:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// POST /api/roles
router.post('/', async (req, res) => {
    const { nombre, descripcion, acceso_total, activo } = req.body;

    if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({ success: false, mensaje: 'El nombre es requerido' });
    }

    try {
        const [existe] = await pool.query(
            'SELECT id FROM roles WHERE nombre = ? LIMIT 1',
            [String(nombre).trim()]
        );
        if (existe.length > 0) {
            return res.status(409).json({ success: false, mensaje: 'Ya existe un rol con ese nombre' });
        }

        const [result] = await pool.query(
            'INSERT INTO roles (nombre, descripcion, acceso_total, activo) VALUES (?, ?, ?, ?)',
            [
                String(nombre).trim(),
                descripcion || null,
                acceso_total ? 1 : 0,
                activo === undefined ? 1 : (activo ? 1 : 0)
            ]
        );
        const [nuevo] = await pool.query(
            'SELECT id, nombre, descripcion, acceso_total, activo, creado_en FROM roles WHERE id = ?',
            [result.insertId]
        );
        res.status(201).json({ success: true, data: nuevo[0], mensaje: 'Rol creado correctamente' });
    } catch (err) {
        console.error('Error en POST /api/roles:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// PUT /api/roles/:id
router.put('/:id', async (req, res) => {
    const { nombre, descripcion, acceso_total, activo } = req.body;

    if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({ success: false, mensaje: 'El nombre es requerido' });
    }

    try {
        const [existe] = await pool.query(
            'SELECT id FROM roles WHERE nombre = ? AND id <> ? LIMIT 1',
            [String(nombre).trim(), req.params.id]
        );
        if (existe.length > 0) {
            return res.status(409).json({ success: false, mensaje: 'Ya existe un rol con ese nombre' });
        }

        const [result] = await pool.query(
            'UPDATE roles SET nombre = ?, descripcion = ?, acceso_total = ?, activo = ? WHERE id = ?',
            [
                String(nombre).trim(),
                descripcion || null,
                acceso_total ? 1 : 0,
                activo === undefined ? 1 : (activo ? 1 : 0),
                req.params.id
            ]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, mensaje: 'Rol no encontrado' });
        }
        res.json({ success: true, mensaje: 'Rol actualizado correctamente' });
    } catch (err) {
        console.error('Error en PUT /api/roles/:id:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// PATCH /api/roles/:id/estado  (baja lógica)
router.patch('/:id/estado', async (req, res) => {
    const activo = Number(req.body.activo);

    if (activo !== 0 && activo !== 1) {
        return res.status(400).json({ success: false, mensaje: 'El campo activo debe ser 0 o 1' });
    }

    try {
        const [result] = await pool.query('UPDATE roles SET activo = ? WHERE id = ?', [activo, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, mensaje: 'Rol no encontrado' });
        }
        res.json({ success: true, mensaje: activo ? 'Rol activado' : 'Rol inactivado' });
    } catch (err) {
        console.error('Error en PATCH /api/roles/:id/estado:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// DELETE /api/roles/:id (baja física, solo si no tiene usuarios asignados)
router.delete('/:id', async (req, res) => {
    try {
        const [enUso] = await pool.query(
            'SELECT COUNT(*) AS total FROM usuario_roles WHERE rol_id = ?',
            [req.params.id]
        );
        if (enUso[0].total > 0) {
            return res.status(409).json({
                success: false,
                mensaje: 'No se puede eliminar: hay usuarios con este rol asignado. Inactívelo en su lugar.'
            });
        }

        const [result] = await pool.query('DELETE FROM roles WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, mensaje: 'Rol no encontrado' });
        }
        res.json({ success: true, mensaje: 'Rol eliminado correctamente' });
    } catch (err) {
        console.error('Error en DELETE /api/roles/:id:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

module.exports = router;