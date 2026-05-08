@echo off
chcp 65001 >nul
echo.
echo  🌸 Roderikus Poem — Push ke GitHub
echo  ====================================
echo.

cd /d "%~dp0"

:: Cek apakah ada perubahan
git status --short
echo.

:: Minta pesan commit (opsional)
set /p MSG="📝 Pesan commit (tekan Enter untuk default): "
if "%MSG%"=="" set MSG=Update puisi

echo.
echo  ⏳ Memproses...
echo.

git add .
git commit -m "%MSG%"
git push

echo.
echo  ✅ Berhasil push ke GitHub!
echo.
pause
