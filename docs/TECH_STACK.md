# BillCraft Desktop — Tech Stack

## Complete Technology Matrix

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Desktop Shell | Electron | 33.2.0 | Native window, system tray, IPC |
| Frontend | React | 18.3.1 | Component-based UI |
| UI Framework | MUI (Material UI) | 6.1.7 | Design system, components |
| Data Grid | MUI X Data Grid | 7.22.2 | Tables with sort/filter/pagination |
| Date Pickers | MUI X Date Pickers | 7.22.2 | Date range selection |
| Charts | Recharts | 2.13.3 | Dashboard visualizations |
| Routing | React Router DOM | 6.28.0 | Client-side navigation |
| HTTP Client | Axios | 1.7.7 | REST API communication |
| Date Handling | Day.js | 1.11.13 | Date formatting and manipulation |
| Language | TypeScript | 4.9.5 | Type-safe JavaScript |
| Backend | Spring Boot | 3.3.5 | REST API framework |
| Runtime | Java (JDK) | 21 | Backend runtime |
| Security | Spring Security | 6.x | Authentication & authorization |
| JWT | jjwt (io.jsonwebtoken) | 0.12.6 | Token generation & validation |
| ORM | Spring Data JPA / Hibernate | 6.x | Object-relational mapping |
| Database | H2 | 2.x | Embedded SQL database |
| Migrations | Flyway | 10.x | Schema version control |
| PDF Generation | OpenPDF | 2.0.3 | Invoice PDF creation |
| Excel Export | Apache POI | 5.3.0 | Spreadsheet generation |
| CSV Export | OpenCSV | 5.9 | CSV file generation |
| Monitoring | Spring Boot Actuator | 3.3.5 | Health checks, shutdown |
| Annotations | Lombok | latest | Boilerplate reduction |
| Build (Backend) | Gradle | 8.x | Java build automation |
| Build (Frontend) | React Scripts (CRA) | 5.x | Webpack bundling |
| Installer | electron-builder | 25.1.8 | Windows NSIS installer |
| Process Mgmt | tree-kill | 1.2.2 | Process tree termination |
| Logging (Electron) | electron-log | 5.x | Desktop app logging |

## Frontend Stack Details

### React Application (`electron-app/renderer/`)

```
React 18.3.1
├── @mui/material 6.1.7          → UI components (Button, Dialog, Card, etc.)
├── @mui/icons-material 6.1.7    → Material Design icons
├── @mui/x-data-grid 7.22.2     → Advanced data tables
├── @mui/x-date-pickers 7.22.2  → Date/time pickers
├── @emotion/react + styled     → CSS-in-JS styling engine
├── react-router-dom 6.28.0     → Hash-based routing
├── recharts 2.13.3             → Area charts, pie charts, bar charts
├── axios 1.7.7                 → HTTP client with interceptors
├── dayjs 1.11.13              → Date manipulation
└── typescript 4.9.5            → Static type checking
```

### Theme Configuration
- **Primary:** Deep Indigo (`#1a237e`)
- **Secondary:** Orange (`#ff6d00`)
- **Font:** Inter (system fallback: Roboto, Arial)
- **Border Radius:** 12px (rounded design)
- **Elevation:** Cards with hover animation
- **Layout:** Permanent sidebar (270px) + glassmorphism AppBar

### State Management
- **Authentication:** React Context API (`AuthContext`)
- **Page State:** Component-level `useState` / `useEffect`
- **No Redux** — simple context + local state sufficient for this app

### Key Frontend Patterns
- **Protected Routes:** `PrivateRoute` wrapper checks `isAuthenticated`
- **API Interceptors:** Auto-attach JWT token, auto-logout on 401
- **Hash Router:** Required for Electron's `file://` protocol
- **Responsive Design:** MUI Grid system with breakpoints

## Backend Stack Details

### Spring Boot Application (`springboot-backend/`)

```
Spring Boot 3.3.5 (Java 21)
├── spring-boot-starter-web          → REST controllers, embedded Tomcat
├── spring-boot-starter-security     → Authentication, authorization
├── spring-boot-starter-data-jpa     → Hibernate ORM, repositories
├── spring-boot-starter-validation   → Bean validation (@NotNull, @Size)
├── spring-boot-starter-actuator     → Health, shutdown endpoints
├── h2 (runtime)                     → Embedded SQL database
├── flyway-core                      → Database migrations
├── jjwt-api + impl + jackson 0.12.6 → JWT token management
├── openpdf 2.0.3                    → PDF document generation
├── poi + poi-ooxml 5.3.0            → Excel spreadsheet creation
├── opencsv 5.9                      → CSV file generation
└── lombok (compileOnly)             → @Data, @Builder, @Slf4j
```

### Backend Architecture Patterns
- **Layered Architecture:** Controller → Service → Repository → Entity
- **DTO Pattern:** Separate request/response objects from entities
- **Stateless Auth:** JWT in every request, no server sessions
- **Soft Delete:** Customers and products use `active` flag
- **Auto-numbering:** Invoices get sequential `INV-XXXX` numbers
- **Scheduled Tasks:** `@EnableScheduling` for auto-backup (24h interval)
- **Graceful Shutdown:** Actuator endpoint + 10s timeout

### Database Configuration
| Setting | Value |
|---------|-------|
| Engine | H2 2.x (file mode) |
| URL | `jdbc:h2:file:~/.billcraft/data/billcraftdb` |
| Mode | LEGACY (MySQL compatibility) |
| DDL | Validate (Flyway manages schema) |
| Connection Pool | HikariCP (Spring Boot default) |
| Timezone | Asia/Kolkata |

## Electron Shell Details

### Main Process (`electron-app/main.js`)

```
Electron 33.2.0
├── axios                → Health check polling
├── electron-log         → Structured logging
├── tree-kill            → Clean process termination
└── child_process        → Java backend spawning
```

### IPC API (Context Bridge)
| Method | Direction | Purpose |
|--------|-----------|---------|
| `getBackendUrl()` | Renderer → Main | Get API base URL |
| `getAppVersion()` | Renderer → Main | Display version |
| `getAppDataPath()` | Renderer → Main | File path resolution |
| `showNotification(title, body)` | Renderer → Main | Native OS notification |
| `printInvoice(id, type)` | Renderer → Main | PDF/thermal printing |
| `selectFile()` | Renderer → Main | File open dialog |
| `getCompanyName()` | Renderer → Main | From config.json |

## Build Toolchain

| Tool | Purpose |
|------|---------|
| Gradle 8.x | Backend compilation + fat JAR packaging |
| React Scripts (CRA) | Frontend bundling (Webpack + Babel) |
| electron-builder | Windows installer (NSIS) |
| jlink (JDK 21) | Custom minimal JRE image |
| Node.js 20.18.0 | Frontend build + Electron runtime |

### Build Outputs
| Artifact | Size (approx) | Location |
|----------|---------------|----------|
| `billcraft-backend.jar` | ~50 MB | `springboot-backend/build/libs/` |
| React build | ~500 KB | `electron-app/renderer/build/` |
| Bundled JRE | ~120 MB | `runtime/jre/` |
| Installer | ~180 MB | `installer/output/` |

## Development Tools

| Tool | Purpose |
|------|---------|
| VS Code | Primary IDE |
| Node.js 20.18.0 | Bundled in `tools/` for dev |
| MinGit 2.47.1 | Version control |
| H2 Console | Database inspection (disabled in prod) |

## Runtime Requirements (End User)

| Requirement | Details |
|-------------|---------|
| OS | Windows 10/11 (x64) |
| RAM | 4 GB minimum (JVM + Electron) |
| Disk | ~300 MB installed |
| Java | NOT required (bundled JRE) |
| Network | NOT required (fully offline) |
| Printer | Optional (A4 or 80mm thermal) |

## Security Stack

| Component | Technology |
|-----------|-----------|
| Authentication | JWT (HMAC-SHA256) |
| Password Storage | BCrypt (10 rounds) |
| API Security | Spring Security filter chain |
| Token Expiry | 24 hours |
| CORS | All origins (localhost only) |
| Transport | HTTP (local only, no TLS needed) |
