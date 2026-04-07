const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    console.log('Attempting to connect to MySQL...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        });

        console.log('Connected to MySQL server successfully.');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon but handle potential issues with multi-line statements
        const queries = schema.split(';').filter(query => query.trim() !== '');

        console.log(`Executing ${queries.length} queries...`);

        for (let query of queries) {
            await connection.query(query);
        }

        console.log('Database and tables created successfully.');
        await connection.end();
    } catch (err) {
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\nERROR: Access Denied to MySQL.');
            console.error('Please check your .env file and ensure DB_USER and DB_PASS are correct.');
            console.log('Current .env settings:');
            console.log(`DB_USER=${process.env.DB_USER}`);
            console.log(`DB_PASS=${process.env.DB_PASS ? '(hidden)' : '(empty)'}`);
        } else {
            console.error('Error initializing database:', err);
        }
        process.exit(1);
    }
}

initDB().catch(err => {
    console.error('Error initializing database:', err);
});
