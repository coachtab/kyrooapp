@echo off
:: kyroo.bat — Start the full Kyroo stack (DB + backend + frontend + mobile)
:: Usage: kyroo.bat [start|db|backend|frontend|mobile|android|ios|install|seed]

setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
set "MOBILE_DIR=%ROOT%mobile"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "CMD=%~1"
if "%CMD%"=="" set "CMD=start"

where node >nul 2>&1 || (echo Error: Node.js not found. Install from https://nodejs.org & exit /b 1)
where npm  >nul 2>&1 || (echo Error: npm not found. & exit /b 1)

goto :%CMD% 2>nul || (
  echo Kyroo — Usage: kyroo.bat [start^|db^|backend^|mobile^|android^|ios^|frontend^|install^|migrate^|seed^|users]
  echo.
  echo   start      Start DB + backend + mobile ^(default^)
  echo   db         Start PostgreSQL container
  echo   backend    Start Express API ^(port 3002^)
  echo   mobile     Start Expo mobile in browser ^(port 8081^)
  echo   android    Start Expo on Android
  echo   ios        Start Expo on iOS
  echo   frontend   Start Vite web app ^(port 5173^)
  echo   install    Install all dependencies
  echo   migrate    Run database migration
  echo   seed       Seed plans and habits
  echo   users      Create test users
  exit /b 1
)
goto :eof

:: ── Helpers ──────────────────────────────────────────────────────────────────

:free_port
  for /f "tokens=*" %%P in ('powershell -NoProfile -Command "try{(Get-NetTCPConnection -LocalPort %1 -EA Stop).OwningProcess}catch{}" 2^>nul') do (
    echo Freeing port %1 ^(PID %%P^)...
    powershell -NoProfile -Command "Stop-Process -Id %%P -Force -ErrorAction SilentlyContinue" >nul 2>&1
  )
  goto :eof

:ensure_backend_deps
  if not exist "%BACKEND_DIR%\node_modules" (
    echo Installing backend dependencies...
    cd /d "%BACKEND_DIR%" && call npm install
  )
  goto :eof

:ensure_frontend_deps
  if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing frontend dependencies...
    cd /d "%FRONTEND_DIR%" && call npm install
  )
  goto :eof

:ensure_mobile_deps
  if not exist "%MOBILE_DIR%\node_modules" (
    echo Installing mobile dependencies...
    cd /d "%MOBILE_DIR%" && call npm install && node scripts\generate-icons.js
  )
  goto :eof

:: ── Commands ─────────────────────────────────────────────────────────────────

:install
  echo Installing all dependencies...
  cd /d "%BACKEND_DIR%"  && call npm install
  cd /d "%FRONTEND_DIR%" && call npm install
  cd /d "%MOBILE_DIR%"   && call npm install && node scripts\generate-icons.js
  echo All dependencies installed.
  goto :eof

:seed
  call :ensure_backend_deps
  echo Seeding database...
  cd /d "%ROOT%"
  call node db\seed.js
  goto :eof

:migrate
  call :ensure_backend_deps
  echo Running database migration...
  cd /d "%ROOT%"
  call node db\migrate.js
  goto :eof

:users
  call :ensure_backend_deps
  echo Creating test users...
  cd /d "%ROOT%"
  call node db\create-test-users.js
  goto :eof

:db
  echo Starting PostgreSQL container...
  cd /d "%ROOT%"
  where docker >nul 2>&1 || (echo Error: Docker not found. Install Docker Desktop from https://docker.com & exit /b 1)
  docker info >nul 2>&1 || (echo Error: Docker Desktop is not running. Please start it and try again. & exit /b 1)
  set DB_PORT=15434
  docker compose up -d --wait
  if errorlevel 1 (echo Error: Failed to start database container. & exit /b 1)
  echo Database ready on port 15434.
  goto :eof

:backend
  call :ensure_backend_deps
  call :free_port 3002
  echo Starting Kyroo backend on http://localhost:3002 ...
  cd /d "%BACKEND_DIR%"
  call npm run dev
  goto :eof

:frontend
  call :ensure_frontend_deps
  echo Starting Kyroo frontend on http://localhost:5173 ...
  cd /d "%FRONTEND_DIR%"
  call npm run dev
  goto :eof

:start
  echo Starting Kyroo (DB + backend + mobile)...
  cd /d "%ROOT%"

  :: Check Docker
  where docker >nul 2>&1 || (echo Error: Docker not found. Install Docker Desktop from https://docker.com & exit /b 1)
  docker info >nul 2>&1 || (echo Error: Docker Desktop is not running. Please start it and try again. & exit /b 1)

  :: Start DB
  set DB_PORT=15434
  docker compose up -d --wait
  if errorlevel 1 (echo Error: Failed to start database. & exit /b 1)
  echo [DB] PostgreSQL ready on port 15434.

  :: Open backend in new window
  call :ensure_backend_deps
  call :free_port 3002
  start "Kyroo Backend" cmd /k "cd /d "%BACKEND_DIR%" && npm run dev"

  :: Open mobile (Expo web) in new window
  call :ensure_mobile_deps
  start "Kyroo Mobile" cmd /k "cd /d "%MOBILE_DIR%" && npx expo start --web"

  echo.
  echo  Kyroo is starting:
  echo    Backend  -^>  http://localhost:3002
  echo    Mobile   -^>  http://localhost:8081  (opens in browser automatically)
  echo.
  echo  First run? Seed the DB in a new terminal:
  echo    kyroo.bat seed
  goto :eof

:mobile
  call :ensure_mobile_deps
  echo Starting Kyroo mobile in browser...
  cd /d "%MOBILE_DIR%"
  call npx expo start --web
  goto :eof

:android
  call :ensure_mobile_deps
  echo Starting Kyroo on Android...
  cd /d "%MOBILE_DIR%"
  call npx expo start --android
  goto :eof

:ios
  call :ensure_mobile_deps
  echo Warning: iOS simulator requires macOS. Use Expo Go on a physical device.
  cd /d "%MOBILE_DIR%"
  call npx expo start --ios
  goto :eof
