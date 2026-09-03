const express      = require('express');
const router       = express.Router();
const authenticate = require('../middleware/authenticate');
const db           = require('../db');

// Lista (sin imagen para no sobrecargar)
router.get('/', authenticate, async (req, res) => {
    const [rows] = await db.execute(
        `SELECT id, nombre_imagen, total_detecciones, detecciones, creado_en
         FROM analisis WHERE usuario_id = ? ORDER BY creado_en DESC LIMIT 50`,
        [req.user.id]
    );
    res.json(rows);
});

// Detalle (con imagen anotada)
router.get('/:id', authenticate, async (req, res) => {
    const [rows] = await db.execute(
        'SELECT * FROM analisis WHERE id = ? AND usuario_id = ?',
        [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Análisis no encontrado' });
    res.json(rows[0]);
});

module.exports = router;
