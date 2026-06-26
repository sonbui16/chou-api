require("dotenv").config();
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const BACKUP_DIR = path.join(__dirname, '../../backups');
const MAX_AGE_DAYS = 30;
// pg_dump không có sẵn trong PATH (Postgres.app) → chỉ rõ đường dẫn, cho phép override qua .env
const PG_DUMP = process.env.PG_DUMP || '/Applications/Postgres.app/Contents/Versions/17/bin/pg_dump';

function backupDB() {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const date = new Date().toISOString().slice(0, 10); // 2026-06-26
    const file = path.join(BACKUP_DIR, `${process.env.DB_NAME}-${date}.sql`);

    console.log('backing up database →', file);
    const dump = spawn(
        PG_DUMP,
        [
            "-h", process.env.DB_HOST,
            "-p", process.env.DB_PORT,
            "-U", process.env.DB_USER,
            "-d", process.env.DB_NAME,
            "-f", file, // ghi thẳng ra file, KHÔNG dùng ">"
        ],
        { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } }
    );

    dump.stderr.on('data', (d) => console.error(`pg_dump: ${d}`));
    dump.on('error', (err) => console.error('Không chạy được pg_dump:', err));
    dump.on('close', (code) => {
        if (code === 0) {

            console.log('Backup xong:', file);
            cleanupOldBackups();
        } else {
            console.error(`pg_dump thất bại, code ${code}`);
        }
    });
}

function cleanupOldBackups() {
    const limit = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    for (const name of fs.readdirSync(BACKUP_DIR)) {
        const f = path.join(BACKUP_DIR, name);
        if (fs.statSync(f).mtimeMs < limit) {
            fs.unlinkSync(f);
            console.log('Xoá backup cũ:', name);
        }
    }
}

module.exports = backupDB;
