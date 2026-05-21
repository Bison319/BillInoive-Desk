# BillCraft Desktop - Billing & Payment Platform

A fully installable Windows desktop billing application for furniture shops in India. Works completely offline with no external dependencies.

## Features

- **GST-compliant Invoicing** - Create invoices with automatic GST calculation (CGST/SGST)
- **PDF Invoice Generation** - A4 and thermal receipt formats
- **Customer Management** - Full CRUD with credit limit tracking
- **Product Catalog** - Categories, pricing, stock management with GST rates
- **Payment Tracking** - Cash, UPI, Bank Transfer, Card with partial payment support
- **Reports & Analytics** - Daily sales, outstanding dues, GST reports, payment analytics
- **Excel/CSV Export** - Export invoices and payments data
- **Backup & Restore** - Automatic scheduled backups + manual backup/restore
- **Audit Logging** - Track all user actions
- **Offline-First** - Everything runs locally, no internet required

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Desktop Shell | Electron 33 |
| Frontend | React 18 + Material UI 6 + TypeScript |
| Backend | Spring Boot 3.3.5 (embedded) |
| Database | H2 File-based (no installation needed) |
| PDF | OpenPDF |
| Excel | Apache POI |
| Auth | JWT + BCrypt |
| Build | Gradle 8.10 + electron-builder |
| Installer | NSIS (Windows .exe) |

## Prerequisites (For Development)

- **Java 21** (JDK) - [Download](https://adoptium.net/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm 9+** (comes with Node.js)

> End users don't need any of these - the installer bundles everything.

## Project Structure

```
billcraft-desktop/
├── springboot-backend/          # Spring Boot API server
│   ├── build.gradle
│   └── src/main/java/com/billcraft/
│       ├── controller/          # REST endpoints
│       ├── service/             # Business logic
│       ├── repository/          # Data access
│       ├── domain/              # Entities & enums
│       ├── dto/                 # Request/Response DTOs
│       ├── security/            # JWT auth
│       ├── config/              # Spring config
│       └── exception/           # Error handling
├── electron-app/                # Electron desktop wrapper
│   ├── main.js                  # Electron main process
│   ├── preload.js               # Context bridge
│   ├── splash.html              # Loading screen
│   ├── package.json             # Electron + builder config
│   └── renderer/                # React frontend
│       ├── src/
│       │   ├── pages/           # All page components
│       │   ├── services/api.ts  # API client
│       │   ├── context/         # Auth context
│       │   └── components/      # Shared components
│       └── package.json
├── runtime/jre/                 # Bundled JRE (created during build)
├── build.bat                    # Full build script
├── make-installer.bat           # Build + create installer
├── gradlew.bat                  # Gradle wrapper
└── settings.gradle              # Gradle settings
```

## Quick Start (Development)

### 1. Build the Backend

```bash
gradlew.bat bootJar -p springboot-backend
```

### 2. Install Frontend Dependencies

```bash
cd electron-app/renderer
npm install
```

### 3. Install Electron Dependencies

```bash
cd electron-app
npm install
```

### 4. Run in Development Mode

```bash
cd electron-app
npm start
```

This starts the Spring Boot backend automatically and opens the Electron window.

## Building the Installer

### One-Command Build

```bash
build.bat
```

This will:
1. Build the Spring Boot JAR
2. Install and build the React frontend
3. Install Electron dependencies
4. Create a bundled JRE via `jlink`

### Create Windows Installer

```bash
make-installer.bat
```

Output: `installer/output/BillCraft Setup x.x.x.exe`

### Manual JRE Bundling

If `jlink` isn't available, manually copy a Java 21 JRE to `runtime/jre/`:

```bash
# Using jlink (recommended - creates minimal ~50MB JRE)
jlink --add-modules java.base,java.logging,java.sql,java.naming,java.desktop,java.management,java.security.jgss,java.instrument,java.net.http,jdk.crypto.ec,jdk.unsupported --strip-debug --no-man-pages --no-header-files --compress=zip-6 --output runtime/jre

# Or copy full JDK (larger but simpler)
xcopy "%JAVA_HOME%" runtime\jre /E /I
```

## Default Login

- **Username:** `admin`
- **Password:** `admin123`

## Data Storage

All data is stored in the user's home directory:

| Data | Location |
|------|----------|
| Database | `~/.billcraft/data/billcraftdb.mv.db` |
| Backups | `~/.billcraft/backups/` |
| Logs | `~/.billcraft/logs/` |

## API Endpoints (Internal)

The backend runs on `http://localhost:8080`. Key endpoints:

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/login` | Login |
| `GET /api/v1/customers` | List customers |
| `POST /api/v1/customers` | Create customer |
| `GET /api/v1/products` | List products |
| `POST /api/v1/invoices` | Create invoice |
| `GET /api/v1/invoices/{id}/pdf` | Download PDF |
| `GET /api/v1/invoices/{id}/thermal` | Thermal receipt |
| `POST /api/v1/payments` | Record payment |
| `GET /api/v1/reports/daily-sales` | Daily sales report |
| `GET /api/v1/reports/outstanding-dues` | Outstanding dues |
| `POST /api/v1/backup/create` | Create backup |
| `POST /api/v1/backup/restore` | Restore from backup |
| `GET /api/v1/health` | Health check |

## Troubleshooting

### Backend doesn't start
- Check if port 8080 is already in use: `netstat -aon | findstr 8080`
- Check logs at `~/.billcraft/logs/app.log`

### Database errors
- Delete `~/.billcraft/data/` to start fresh (data will be lost)
- Flyway migrations handle schema creation automatically

### Installer build fails
- Ensure the backend JAR exists: `springboot-backend/build/libs/billcraft-backend.jar`
- Ensure JRE exists: `runtime/jre/bin/java.exe`
- Check electron-builder output for details
