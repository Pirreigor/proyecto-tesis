const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/authenticate');

router.use(auth);

// Listar pacientes del usuario
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT p.*,
                (SELECT COUNT(*) FROM citas c WHERE c.paciente_id = p.id) AS total_citas,
                (SELECT COUNT(*) FROM analisis a WHERE a.paciente_id = p.id) AS total_analisis
             FROM pacientes p WHERE p.usuario_id = ? ORDER BY p.apellido, p.nombre`,
            [req.user.id]
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Crear paciente
router.post('/', async (req, res) => {
    const { nombre, apellido, fecha_nacimiento, sexo, telefono, email, direccion, notas } = req.body;
    if (!nombre || !apellido) return res.status(400).json({ error: 'Nombre y apellido requeridos' });
    try {
        const [r] = await db.query(
            `INSERT INTO pacientes (usuario_id, nombre, apellido, fecha_nacimiento, sexo, telefono, email, direccion, notas)
             VALUES (?,?,?,?,?,?,?,?,?)`,
            [req.user.id, nombre, apellido, fecha_nacimiento || null, sexo || null,
             telefono || null, email || null, direccion || null, notas || null]
        );
        res.status(201).json({ id: r.insertId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Obtener un paciente con toda su información
router.get('/:id', async (req, res) => {
    try {
        const [[paciente]] = await db.query(
            'SELECT * FROM pacientes WHERE id = ? AND usuario_id = ?',
            [req.params.id, req.user.id]
        );
        if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

        const [[condiciones], [citas], [tratamientos], [prescripciones], [analisis]] = await Promise.all([
            db.query('SELECT * FROM condiciones WHERE paciente_id = ? ORDER BY activa DESC, creado_en DESC', [paciente.id]),
            db.query('SELECT * FROM citas WHERE paciente_id = ? ORDER BY fecha_hora DESC', [paciente.id]),
            db.query('SELECT * FROM tratamientos WHERE paciente_id = ? ORDER BY creado_en DESC', [paciente.id]),
            db.query('SELECT id, medicamento, dosis, frecuencia, duracion, indicaciones, fecha, creado_en FROM prescripciones WHERE paciente_id = ? ORDER BY creado_en DESC', [paciente.id]),
            db.query('SELECT id, nombre_imagen, total_detecciones, creado_en FROM analisis WHERE paciente_id = ? ORDER BY creado_en DESC', [paciente.id]),
        ]);

        res.json({ paciente, condiciones, citas, tratamientos, prescripciones, analisis });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Actualizar paciente
router.put('/:id', async (req, res) => {
    const { nombre, apellido, fecha_nacimiento, sexo, telefono, email, direccion, notas } = req.body;
    try {
        await db.query(
            `UPDATE pacientes SET nombre=?, apellido=?, fecha_nacimiento=?, sexo=?, telefono=?, email=?, direccion=?, notas=?
             WHERE id=? AND usuario_id=?`,
            [nombre, apellido, fecha_nacimiento || null, sexo || null,
             telefono || null, email || null, direccion || null, notas || null,
             req.params.id, req.user.id]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Eliminar paciente
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM pacientes WHERE id=? AND usuario_id=?', [req.params.id, req.user.id]);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── Condiciones ──────────────────────────────────────────────────────────────
router.post('/:id/condiciones', async (req, res) => {
    const { condicion, descripcion, fecha_diagnostico, activa } = req.body;
    if (!condicion) return res.status(400).json({ error: 'Condición requerida' });
    try {
        const [r] = await db.query(
            'INSERT INTO condiciones (paciente_id, condicion, descripcion, fecha_diagnostico, activa) VALUES (?,?,?,?,?)',
            [req.params.id, condicion, descripcion || null, fecha_diagnostico || null, activa !== false]
        );
        res.status(201).json({ id: r.insertId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/:id/condiciones/:cid', async (req, res) => {
    const { condicion, descripcion, fecha_diagnostico, activa } = req.body;
    try {
        await db.query(
            'UPDATE condiciones SET condicion=?, descripcion=?, fecha_diagnostico=?, activa=? WHERE id=? AND paciente_id=?',
            [condicion, descripcion || null, fecha_diagnostico || null, activa !== false, req.params.cid, req.params.id]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/:id/condiciones/:cid', async (req, res) => {
    try {
        await db.query('DELETE FROM condiciones WHERE id=? AND paciente_id=?', [req.params.cid, req.params.id]);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
