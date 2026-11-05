@echo off
title HANOI OPEN REVERIE - WEB SERVER 24/7
color 0A
cd /d "%~dp0"
echo =======================================================
echo   HA NOI: CHAM VAO KY UC (HANOI: OPEN REVERIE)
echo   Khoi dong May Chu Web 24/7 (Tu dong hoi sinh khi loi)
echo =======================================================
echo.
echo   Link Local:  http://localhost:3000
echo   Link Mobile: http://192.168.0.105:3000
echo.
echo   Dang khoi chay, vui long khong tat cua so nay...
echo =======================================================
node scripts/keep_alive.js
pause
