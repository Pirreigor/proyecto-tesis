const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// Health check — diagnóstico de BD sin autenticación
app.get('/api/health', async (_req, res) => {
    const db = require('./db');
    try {
        await db.query('SELECT 1');
        res.json({ ok: true, db: 'connected', env: process.env.NODE_ENV || 'development' });
    } catch (e) {
        res.status(500).json({ ok: false, db: 'error', error: e.message });
    }
});

app.use('/api/auth',           require('./routes/auth'));
app.use('/api/predict',        require('./routes/predict'));
app.use('/api/history',        require('./routes/history'));
app.use('/api/pacientes',      require('./routes/pacientes'));
app.use('/api/citas',          require('./routes/citas'));
app.use('/api/tratamientos',   require('./routes/tratamientos'));
app.use('/api/prescripciones', require('./routes/prescripciones'));

// Servir React en producción
if (process.env.NODE_ENV === 'production') {
    const dist = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend en puerto ${PORT}`));
