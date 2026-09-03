const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../db');

router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password)
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    try {
        const hash = await bcrypt.hash(password, 10);
        const [r] = await db.execute(
            'INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)',
            [nombre, email, hash]
        );
        res.status(201).json({ message: 'Usuario registrado', id: r.insertId });
    } catch (err) {
        console.error('REGISTER ERROR:', err.message, err.code);
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'El correo ya está registrado' });
        res.status(500).json({ error: 'Error del servidor' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    try {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (!rows.length) return res.status(401).json({ error: 'Credenciales incorrectas' });
        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });
        const token = jwt.sign(
            { id: user.id, nombre: user.nombre },
            process.env.JWT_SECRET || 'secret_dev',
            { expiresIn: '8h' }
        );
        res.json({ token, nombre: user.nombre, email: user.email });
    } catch {
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;
