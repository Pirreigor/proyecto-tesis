const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/predict', require('./routes/predict'));
app.use('/api/history', require('./routes/history'));

// Servir React en producción
if (process.env.NODE_ENV === 'production') {
    const dist = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend en puerto ${PORT}`));
