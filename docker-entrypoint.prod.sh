#!/bin/sh
set -e

# Production: chỉ áp migration, KHÔNG seed dữ liệu demo
npx prisma migrate deploy

# Khởi động HTTP server (listen :4000)
node server.js
