const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/authenticate');

router.use(auth);

// Listar citas (con filtros opcionales: ?estado=pendiente&fecha=2025-01)
router.get('/', async (req, res) => {
    try {
        const { estado, paciente_id, fecha } = req.query;
        let sql = `SELECT c.*, CONCAT(p.nombre,' ',p.apellido) AS paciente_nombre
                   FROM citas c JOIN pacientes p ON p.id = c.paciente_id
                   WHERE c.usuario_id = ?`;
        const params = [req.user.id];
        if (estado)      { sql += ' AND c.estado = ?';               params.push(estado); }
        if (paciente_id) { sql += ' AND c.paciente_id = ?';          params.push(paciente_id); }
        if (fecha)       { sql += ' AND DATE_FORMAT(c.fecha_hora,"%Y-%m") = ?'; params.push(fecha); }
        sql += ' ORDER BY c.fecha_hora DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Crear cita
router.post('/', async (req, res) => {
    const { paciente_id, fecha_hora, motivo, estado, notas } = req.body;
    if (!paciente_id || !fecha_hora) return res.status(400).json({ error: 'paciente_id y fecha_hora requeridos' });
    try {
        const [r] = await db.query(
            'INSERT INTO citas (paciente_id, usuario_id, fecha_hora, motivo, estado, notas) VALUES (?,?,?,?,?,?)',
            [paciente_id, req.user.id, fecha_hora, motivo || null, estado || 'pendiente', notas || null]
        );
        res.status(201).json({ id: r.insertId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Actualizar cita
router.put('/:id', async (req, res) => {
    const { fecha_hora, motivo, estado, notas } = req.body;
    try {
        await db.query(
            'UPDATE citas SET fecha_hora=?, motivo=?, estado=?, notas=? WHERE id=? AND usuario_id=?',
            [fecha_hora, motivo || null, estado, notas || null, req.params.id, req.user.id]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Eliminar cita
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM citas WHERE id=? AND usuario_id=?', [req.params.id, req.user.id]);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
