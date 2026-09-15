const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/departamentos?estado=activo|inactivo|todos
router.get('/', async (req, res) => {
    try {
        const est = req.query.estado || 'todos';
        const where = [];
        const params = [];
        if (est === 'activo') {
            where.push('d.activo = 1');
        } else if (est === 'inactivo') {
            where.push('d.activo = 0');
        }
        const sql = `
            SELECT d.id, d.nombre, d.descripcion, d.activo, d.creado_en,
                   COUNT(u.id) AS numero_usuarios
            FROM departamentos d
            LEFT JOIN usuarios u ON u.departamento_id = d.id
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            GROUP BY d.id
            ORDER BY d.nombre ASC`;

        const [rows] = await pool.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error en GET /api/departamentos:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// GET /api/departamentos/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, nombre, descripcion, activo, creado_en FROM departamentos WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Departamento no encontrado' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error en GET /api/departamentos/:id:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// POST /api/departamentos
router.post('/', async (req, res) => {
    const { nombre, descripcion, activo } = req.body;

    if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({ success: false, mensaje: 'El nombre es requerido' });
    }

    const connection = await pool.getConnection();
    try {
        const [existe] = await connection.query(
            'SELECT id FROM departamentos WHERE nombre = ? LIMIT 1',
            [String(nombre).trim()]
        );
        if (existe.length > 0) {
            return res.status(409).json({ success: false, mensaje: 'Ya existe un departamento con ese nombre' });
        }

        const [result] = await connection.query(
            'INSERT INTO departamentos (nombre, descripcion, activo) VALUES (?, ?, ?)',
            [String(nombre).trim(), descripcion || null, activo === undefined ? 1 : (activo ? 1 : 0)]
        );
        const [nuevo] = await connection.query(
            'SELECT id, nombre, descripcion, activo, creado_en FROM departamentos WHERE id = ?',
            [result.insertId]
        );
        res.status(201).json({ success: true, data: nuevo[0], mensaje: 'Departamento creado correctamente' });
    } catch (err) {
        console.error('Error en POST /api/departamentos:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    } finally {
        connection.release();
    }
});

// PUT /api/departamentos/:id
router.put('/:id', async (req, res) => {
    const { nombre, descripcion, activo } = req.body;

    if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({ success: false, mensaje: 'El nombre es requerido' });
    }

    try {
        const [existe] = await pool.query(
            'SELECT id FROM departamentos WHERE nombre = ? AND id <> ? LIMIT 1',
            [String(nombre).trim(), req.params.id]
        );
        if (existe.length > 0) {
            return res.status(409).json({ success: false, mensaje: 'Ya existe un departamento con ese nombre' });
        }

        const [result] = await pool.query(
            'UPDATE departamentos SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
            [String(nombre).trim(), descripcion || null, activo === undefined ? 1 : (activo ? 1 : 0), req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, mensaje: 'Departamento no encontrado' });
        }
        res.json({ success: true, mensaje: 'Departamento actualizado correctamente' });
    } catch (err) {
        console.error('Error en PUT /api/departamentos/:id:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// PATCH /api/departamentos/:id/estado  (baja lógica)
router.patch('/:id/estado', async (req, res) => {
    const activo = Number(req.body.activo);

    if (activo !== 0 && activo !== 1) {
        return res.status(400).json({ success: false, mensaje: 'El campo activo debe ser 0 o 1' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE departamentos SET activo = ? WHERE id = ?',
            [activo, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, mensaje: 'Departamento no encontrado' });
        }
        res.json({ success: true, mensaje: activo ? 'Departamento activado' : 'Departamento inactivado' });
    } catch (err) {
        console.error('Error en PATCH /api/departamentos/:id/estado:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

// DELETE /api/departamentos/:id (baja física, solo si no tiene usuarios asignados)
router.delete('/:id', async (req, res) => {
    try {
        const [enUso] = await pool.query(
            'SELECT COUNT(*) AS total FROM usuarios WHERE departamento_id = ?',
            [req.params.id]
        );
        if (enUso[0].total > 0) {
            return res.status(409).json({
                success: false,
                mensaje: 'No se puede eliminar: hay usuarios asignados a este departamento. Inactivelo en su lugar.'
            });
        }

        const [result] = await pool.query('DELETE FROM departamentos WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, mensaje: 'Departamento no encontrado' });
        }
        res.json({ success: true, mensaje: 'Departamento eliminado correctamente' });
    } catch (err) {
        console.error('Error en DELETE /api/departamentos/:id:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

module.exports = router;