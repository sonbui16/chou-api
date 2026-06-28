#!/bin/sh
set -e

# Áp các migration sẵn có (gồm ràng buộc EXCLUDE viết bằng SQL thô)
npx prisma migrate deploy

# Nạp dữ liệu + tài khoản demo
node prisma/seed.js

# Khởi động HTTP server (listen :4000)
node server.js
