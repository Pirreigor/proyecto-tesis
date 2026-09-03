const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const FormData   = require('form-data');
const axios      = require('axios');
const authenticate = require('../middleware/authenticate');
const db         = require('../db');

const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 10 * 1024 * 1024 },
});

const FLASK_API = process.env.FLASK_API_URL || 'http://localhost:5000';

router.post('/', authenticate, upload.single('imagen'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen' });

    try {
        const form = new FormData();
        form.append('image', req.file.buffer, {
            filename:    req.file.originalname,
            contentType: req.file.mimetype,
        });
        if (req.body.confidence) form.append('confidence', req.body.confidence);

        const { data } = await axios.post(`${FLASK_API}/predict`, form, {
            headers:          form.getHeaders(),
            timeout:          60000,
            maxBodyLength:    Infinity,
            maxContentLength: Infinity,
        });

        await db.execute(
            'INSERT INTO analisis (usuario_id, nombre_imagen, total_detecciones, detecciones, resultado_base64) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, req.file.originalname, data.total_detections, JSON.stringify(data.detections), data.image_base64]
        );

        res.json(data);
    } catch (err) {
        if (err.code === 'ECONNREFUSED')
            return res.status(503).json({ error: 'La API de detección no está disponible. Asegúrate de que Flask esté corriendo.' });
        console.error(err.message);
        res.status(500).json({ error: 'Error al procesar la imagen' });
    }
});

module.exports = router;
