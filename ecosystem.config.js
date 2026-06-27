// PM2 — chạy SONG SONG 2 tiến trình: HTTP server + cron schedule (backup).
// Lệnh: pm2 start ecosystem.config.js  ·  pm2 save  ·  pm2 startup
// KHÔNG dùng --watch ở production (đó là của dev). PM2 tự restart khi crash/reboot.
module.exports = {
    apps: [
        {
            name: 'chou-api',
            script: 'server.js',
            time: true, // gắn timestamp vào log
            env: {
                NODE_ENV: 'production',
            },
        },
        {
            name: 'chou-schedule',
            script: 'schedule.js',
            time: true,
            env: {
                NODE_ENV: 'production',
                // CronJob chạy theo timezone của tiến trình → ép giờ VN để '0 0 3 * * *' = 3h sáng VN.
                TZ: 'Asia/Ho_Chi_Minh',
            },
        },
    ],
};
