require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { google } = require('googleapis');

// OAuth2: client_id + client_secret + refresh_token (lấy 1 lần qua consent, xem scripts/getGoogleToken.js)
// Cron chạy nền không mở được trình duyệt → BẮT BUỘC dùng refresh_token, không thể chỉ client_id/secret.
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost';

function getDrive() {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
        throw new Error(
            'Thiếu GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN trong .env'
        );
    }
    const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
    auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    return google.drive({ version: 'v3', auth });
}

// Upload 1 file lên folder Backup Database (GOOGLE_DRIVE_FOLDER_ID), trả về { id, webViewLink }
async function uploadToDrive(filePath) {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
        throw new Error('Thiếu GOOGLE_DRIVE_FOLDER_ID trong .env (lấy từ URL folder trên Drive)');
    }

    const drive = getDrive();
    const res = await drive.files.create({
        requestBody: {
            name: path.basename(filePath),
            parents: [folderId],
        },
        media: {
            mimeType: 'application/zip',
            body: fs.createReadStream(filePath),
        },
        fields: 'id, name, webViewLink',
    });
    return res.data;
}

module.exports = { uploadToDrive };
