// Lấy GOOGLE_REFRESH_TOKEN 1 lần. Chạy: node scripts/getGoogleToken.js
// Cần GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET trong .env (OAuth client loại "Desktop app" hoặc Web).
require('dotenv').config();
const readline = require('node:readline');
const { google } = require('googleapis');

const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost';
const SCOPES = ['https://www.googleapis.com/auth/drive.file']; // chỉ file do app tạo

const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
);

const url = oauth2.generateAuthUrl({
    access_type: 'offline', // BẮT BUỘC để nhận refresh_token
    prompt: 'consent',       // ép cấp lại refresh_token mỗi lần
    scope: SCOPES,
});

console.log('\n1) Mở link này, đăng nhập & đồng ý:\n');
console.log(url);
console.log('\n2) Sau khi đồng ý, copy "code" trên URL redirect rồi dán vào đây.\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Dán code: ', async (code) => {
    rl.close();
    try {
        const { tokens } = await oauth2.getToken(code.trim());
        console.log('\n✅ Thêm dòng này vào .env:\n');
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    } catch (err) {
        console.error('Lỗi đổi token:', err.message);
    }
});
