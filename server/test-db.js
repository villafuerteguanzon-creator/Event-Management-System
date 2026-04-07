const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    console.log('--- Database Connection Test ---');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        });
        console.log('SUCCESS: Connected to MySQL server.');
        
        const [rows] = await connection.query('SHOW DATABASES LIKE ?', [process.env.DB_NAME]);
        if (rows.length > 0) {
            console.log(`SUCCESS: Database "${process.env.DB_NAME}" exists.`);
            await connection.query(`USE ${process.env.DB_NAME}`);
            const [tables] = await connection.query('SHOW TABLES');
            console.log(`Tables in database: ${tables.length}`);
            tables.forEach(t => console.log(` - ${Object.values(t)[0]}`));
        } else {
            console.log(`WARNING: Database "${process.env.DB_NAME}" does NOT exist. Run node init-db.js`);
        }
        await connection.end();
    } catch (err) {
        console.error('FAILURE: Could not connect to MySQL.');
        console.error('Error details:', err.message);
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('TIP: Check your .env file. Is the password correct? (Common for XAMPP: blank)');
        }
    }
}

testConnection();
