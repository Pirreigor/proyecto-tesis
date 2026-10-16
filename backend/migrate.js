/**
 * Ejecuta la migración v2 (tablas de gestión clínica).
 * Uso: node migrate.js
 */
const db = require('./src/db');
const fs = require('fs');
const path = require('path');

const SQL_PATH = path.join(__dirname, '..', 'database', 'migration_v2.sql');

(async () => {
    const raw = fs.readFileSync(SQL_PATH, 'utf8');
    const stmts = raw
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 5 && !s.startsWith('--'));

    for (const stmt of stmts) {
        try {
            await db.query(stmt);
            console.log('✅', stmt.slice(0, 70).replace(/\s+/g, ' '));
        } catch (e) {
            console.warn('⚠️ ', e.message.slice(0, 100), '\n   »', stmt.slice(0, 60).replace(/\s+/g, ' '));
        }
    }

    console.log('\n✅ Migración completada');
    process.exit(0);
})();
