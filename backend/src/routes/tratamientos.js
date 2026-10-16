const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/authenticate');

router.use(auth);

// Listar tratamientos del usuario (con filtro opcional por paciente o estado)
router.get('/', async (req, res) => {
    try {
        const { paciente_id, estado } = req.query;
        let sql = `SELECT t.*, CONCAT(p.nombre,' ',p.apellido) AS paciente_nombre
                   FROM tratamientos t JOIN pacientes p ON p.id = t.paciente_id
                   WHERE t.usuario_id = ?`;
        const params = [req.user.id];
        if (paciente_id) { sql += ' AND t.paciente_id = ?'; params.push(paciente_id); }
        if (estado)      { sql += ' AND t.estado = ?';      params.push(estado); }
        sql += ' ORDER BY t.creado_en DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Crear tratamiento
router.post('/', async (req, res) => {
    const { paciente_id, cita_id, nombre, descripcion, diente, estado, costo, fecha_inicio, fecha_fin } = req.body;
    if (!paciente_id || !nombre) return res.status(400).json({ error: 'paciente_id y nombre requeridos' });
    try {
        const [r] = await db.query(
            `INSERT INTO tratamientos (paciente_id, cita_id, usuario_id, nombre, descripcion, diente, estado, costo, fecha_inicio, fecha_fin)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [paciente_id, cita_id || null, req.user.id, nombre,
             descripcion || null, diente || null, estado || 'planificado',
             costo || null, fecha_inicio || null, fecha_fin || null]
        );
        res.status(201).json({ id: r.insertId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Actualizar tratamiento
router.put('/:id', async (req, res) => {
    const { nombre, descripcion, diente, estado, costo, fecha_inicio, fecha_fin } = req.body;
    try {
        await db.query(
            `UPDATE tratamientos SET nombre=?, descripcion=?, diente=?, estado=?, costo=?, fecha_inicio=?, fecha_fin=?
             WHERE id=? AND usuario_id=?`,
            [nombre, descripcion || null, diente || null, estado,
             costo || null, fecha_inicio || null, fecha_fin || null,
             req.params.id, req.user.id]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Eliminar tratamiento
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM tratamientos WHERE id=? AND usuario_id=?', [req.params.id, req.user.id]);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── Prescripciones (rutas anidadas bajo tratamiento) ─────────────────────────
router.get('/:id/prescripciones', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM prescripciones WHERE tratamiento_id=? ORDER BY creado_en DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/:id/prescripciones', async (req, res) => {
    const { paciente_id, cita_id, medicamento, dosis, frecuencia, duracion, indicaciones, fecha } = req.body;
    if (!medicamento || !paciente_id) return res.status(400).json({ error: 'medicamento y paciente_id requeridos' });
    try {
        const [r] = await db.query(
            `INSERT INTO prescripciones (paciente_id, tratamiento_id, cita_id, usuario_id, medicamento, dosis, frecuencia, duracion, indicaciones, fecha)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [paciente_id, req.params.id, cita_id || null, req.user.id,
             medicamento, dosis || null, frecuencia || null, duracion || null,
             indicaciones || null, fecha || null]
        );
        res.status(201).json({ id: r.insertId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
