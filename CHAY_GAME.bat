@echo off
title HANOI: OPEN REVERIE - GAME SERVER
echo =======================================================
echo  HA NOI: CHAM VAO KY UC (HANOI: OPEN REVERIE)
echo  Dang khoi dong Game Server tai http://localhost:3000...
echo =======================================================

timeout /t 1 /nobreak >nul
start http://localhost:3000

node server.js
pause
