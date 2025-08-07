@echo off
title DueDesk Application Launcher
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "start-duedesk.ps1"
pause
