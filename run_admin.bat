@echo off
echo ====================================================
echo Starting ISHDAMAN Admin Panel (React + Vite)
echo Port: 3001
echo ====================================================
cd /d "%~dp0"
npm run dev -- --port 3001 --host
pause
