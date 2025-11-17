#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Connection = require('../db');

// Get migration file from command line argument or use default
const migrationFile = process.argv[2] || path.join(__dirname, '..', 'migration_add_phone.sql');

if (!fs.existsSync(migrationFile)) {
    console.error(`Migration file not found: ${migrationFile}`);
    process.exit(1);
}

const sql = fs.readFileSync(migrationFile, 'utf8');

// Initialize database connection
const conn = new Connection('./dbconn.json');
const pool = conn.conn;

console.log('Running migration...');
console.log(`File: ${migrationFile}`);

pool.query(sql, (err, result) => {
    if (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }

    console.log('✓ Migration completed successfully!');
    process.exit(0);
});

