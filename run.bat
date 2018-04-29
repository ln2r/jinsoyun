if not "%minimized%"=="" goto :minimized
set minimized=true
@echo off

cd "C:\Users\ln2r\Dropbox\Personal Project\Discord\grumpy butts bot\dev"

start /min cmd /C "node soyun.js"
goto :EOF
:minimized