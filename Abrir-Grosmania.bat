@echo off
rem Abre Gro'smania en tu equipo (pagina + panel) con una base de datos local de pruebas.
rem Deja esta ventana abierta mientras lo uses; ciérrala para apagarlo.
cd /d "%~dp0"
set DEV_DB=datos-locales.sqlite
echo.
echo  Gro'smania local  ->  http://localhost:8791
echo  Panel             ->  http://localhost:8791/admin.html   (usuario: admin   clave: admin123)
echo  Para apagar: cierra esta ventana.
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8791"
node test\dev-server.mjs
pause
