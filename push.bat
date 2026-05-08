@echo off
echo.
echo  Roderikus Poem - Push ke GitHub
echo  ================================
echo.

cd /d "%~dp0"

git status --short
echo.

set /p MSG="Pesan commit (Enter = default): "
if "%MSG%"=="" set MSG=Update puisi

echo.
echo  Memproses...
echo.

git add .
git commit -m "%MSG%"
git push

echo.
echo  Berhasil push ke GitHub!
echo.
pause
