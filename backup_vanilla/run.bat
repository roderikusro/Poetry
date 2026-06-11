@echo off
echo Menjalankan server lokal menggunakan versi terbaru dari http-server...
echo Pastikan Node.js sudah terinstal di komputer Anda.
echo.
npx http-server@latest -c-1 -p 8080 -o
pause
