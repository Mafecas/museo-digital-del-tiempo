@echo off
chcp 65001 >nul
title Archivo del Tiempo - servidor local
cd /d "%~dp0"
echo.
echo  Iniciando ARCHIVO DEL TIEMPO...
echo.
where py >/dev/null 2>nul
if %errorlevel%==0 (
  py -3 iniciar.py
  goto fin
)
where python >/dev/null 2>nul
if %errorlevel%==0 (
  python iniciar.py
  goto fin
)
echo  No se encontro Python en este equipo.
echo  Instala Python 3 desde https://www.python.org/downloads/
echo  (marca la opcion "Add Python to PATH") y vuelve a abrir este archivo.
echo.
echo  Alternativa sin instalar nada: abre ARCHIVO_DEL_TIEMPO_version_A_ligera.html
pause
:fin
