const db = require('./src/db');
(async () => {
    const [rows] = await db.query('SHOW TABLES');
    console.log('Tablas en Railway:');
    rows.forEach(r => console.log(' -', Object.values(r)[0]));
    process.exit(0);
})();
