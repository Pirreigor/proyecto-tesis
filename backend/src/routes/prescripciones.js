const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/authenticate');

router.use(auth);

// Listar prescripciones del usuario (con filtro por paciente)
router.get('/', async (req, res) => {
    try {
        const { paciente_id } = req.query;
        let sql = `SELECT pr.*, CONCAT(p.nombre,' ',p.apellido) AS paciente_nombre
                   FROM prescripciones pr JOIN pacientes p ON p.id = pr.paciente_id
                   WHERE pr.usuario_id = ?`;
        const params = [req.user.id];
        if (paciente_id) { sql += ' AND pr.paciente_id = ?'; params.push(paciente_id); }
        sql += ' ORDER BY pr.creado_en DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Crear prescripción directa (sin pasar por tratamiento)
router.post('/', async (req, res) => {
    const { paciente_id, tratamiento_id, cita_id, medicamento, dosis, frecuencia, duracion, indicaciones, fecha } = req.body;
    if (!paciente_id || !medicamento) return res.status(400).json({ error: 'paciente_id y medicamento requeridos' });
    try {
        const [r] = await db.query(
            `INSERT INTO prescripciones (paciente_id, tratamiento_id, cita_id, usuario_id, medicamento, dosis, frecuencia, duracion, indicaciones, fecha)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [paciente_id, tratamiento_id || null, cita_id || null, req.user.id,
             medicamento, dosis || null, frecuencia || null, duracion || null,
             indicaciones || null, fecha || null]
        );
        res.status(201).json({ id: r.insertId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Eliminar prescripción
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM prescripciones WHERE id=? AND usuario_id=?', [req.params.id, req.user.id]);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
