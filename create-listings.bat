@echo off
echo ========================================
echo   Script de creation de 100 annonces
echo ========================================
echo.

REM Vérifier que le fichier JSON existe
if not exist "listings_100.json" (
    echo [ERREUR] Le fichier listings_100.json n'existe pas.
    echo.
    echo Veuillez d'abord executer:
    echo   npm run generate-listings
    echo   ou
    echo   node scripts/generate-listings.js
    echo.
    pause
    exit /b 1
)

REM Demander le token de session
set /p SESSION_TOKEN="Entrez votre token de session NextAuth: "

if "%SESSION_TOKEN%"=="" (
    echo [ERREUR] Le token de session est requis.
    pause
    exit /b 1
)

REM Demander l'URL de l'API (optionnel)
set /p API_URL="Entrez l'URL de l'API (defaut: http://localhost:3000): "
if "%API_URL%"=="" set API_URL=http://localhost:3000

echo.
echo Demarrage de la creation des annonces...
echo URL API: %API_URL%
echo.

REM Exécuter le script
set SESSION_TOKEN=%SESSION_TOKEN%
set API_URL=%API_URL%
node scripts/create-listings.js

echo.
pause

