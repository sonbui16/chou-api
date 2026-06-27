require('module-alias/register');
require("dotenv").config();
const { CronJob } = require('cron');

const dailyReport = require('./src/schedules/dailyRepost.js')
const backupDB = require('./src/schedules/backupDB.js')
const cleanupRefreshTokens = require('./src/schedules/cleanupRefreshTokens.js')

// cronTime 2H SANG
new CronJob('*/5 * * * * *', dailyReport, null, true);
// cronTime 3H SANG
new CronJob('0 0 3 * * *', backupDB, null, true);
// 3H30 SANG — dọn refresh token hết hạn/đã revoke lâu
new CronJob('0 30 3 * * *', cleanupRefreshTokens, null, true);




/**
 * 
 * - có dấu (* * * * * *): luôn chay
 *         (* /5 * * * * * ): chạy 5s 1 lần (bỏ dấu cách đi)
 * - 1 ngày backup 1 lần, và backup trong tầm 15 -30 ngày.nghĩa là bản nào quá 30 ngày thì xoá bỏ đi
 * Tạo là lưu trữ trong 1 folder riêng, và có thể zip lại để giảm dung lượng
 * sau khi có backup xong thì upload lên google drive
*/
