# BillCraft Desktop — Workflow

## Application Lifecycle

### 1. Installation Flow

```mermaid
flowchart LR
    A[Run Installer] --> B[Extract Files]
    B --> C[Copy JRE + JAR + Electron]
    C --> D[Create Shortcuts]
    D --> E[Ready to Launch]
```

### 2. Application Startup Flow

```mermaid
flowchart TD
    A[User clicks BillCraft shortcut] --> B[BillCraft.vbs runs silently]
    B --> C[Electron app starts]
    C --> D{First run?}
    D -->|Yes| E[Show Setup Wizard]
    E --> F[Collect Company Name + Owner + GST + Phone]
    F --> G[Save to ~/.billcraft/config.json]
    G --> H[Show Splash Screen]
    D -->|No| H
    H --> I[Spawn Java Backend]
    I --> J[Poll /api/v1/health every 500ms]
    J --> K{Health OK?}
    K -->|No, < 60s| J
    K -->|No, > 60s| L[Show Error + Exit]
    K -->|Yes| M[Sync config to backend settings]
    M --> N[Create Main Window 1400x900]
    N --> O[Load React App]
    O --> P[Show Login Page]
```

### 3. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as React App
    participant A as AuthController
    participant S as AuthService
    participant DB as H2 Database

    U->>R: Enter username + password
    R->>A: POST /api/v1/auth/login
    A->>S: authenticate(username, password)
    S->>DB: findByUsername(username)
    DB-->>S: User entity
    S->>S: BCrypt.matches(password, hash)
    S->>S: Generate JWT (24h expiry)
    S-->>A: AuthResponse(token, role, fullName)
    A-->>R: 200 OK + JWT
    R->>R: Store token in localStorage
    R->>R: Redirect to Dashboard
```

**Default Credentials:** `admin` / `admin123`

### 4. Invoice Creation Workflow

```mermaid
flowchart TD
    A[Navigate to Invoices → Create] --> B[Select Customer]
    B --> C{Customer exists?}
    C -->|No| D[Create New Customer]
    D --> B
    C -->|Yes| E[Add Products to Invoice]
    E --> F[Set Quantity for each item]
    F --> G[System auto-calculates:]
    G --> G1[Line total = qty × unitPrice]
    G --> G2[GST per item = lineTotal × gstRate%]
    G --> G3[Grand total = sum of all line totals + GST]
    G1 --> H[Set Due Date]
    G2 --> H
    G3 --> H
    H --> I[Submit Invoice]
    I --> J[Backend generates INV-XXXX number]
    J --> K[Deduct stock for each product]
    K --> L[Invoice saved as DRAFT]
    L --> M[Audit log created]
```

### 5. Payment Recording Workflow

```mermaid
flowchart TD
    A[Select Invoice with pending amount] --> B[Enter Payment Amount]
    B --> C{Amount ≤ Pending?}
    C -->|No| D[Show Error: Exceeds pending]
    C -->|Yes| E[Select Payment Method]
    E --> F[CASH / UPI / BANK_TRANSFER / CARD]
    F --> G[Optional: Transaction Reference + Notes]
    G --> H[Submit Payment]
    H --> I[Update Invoice paidAmount]
    I --> J{paidAmount == totalAmount?}
    J -->|Yes| K[Status → PAID]
    J -->|No| L[Status → PARTIALLY_PAID]
    K --> M[Audit log created]
    L --> M
```

### 6. PDF Generation Workflow

```mermaid
sequenceDiagram
    participant R as React App
    participant E as Electron Main
    participant B as Backend
    
    R->>E: printInvoice(invoiceId, "a4" | "thermal")
    E->>E: Create hidden BrowserWindow
    E->>B: GET /api/v1/invoices/{id}/pdf (or /thermal)
    B->>B: Build PDF with OpenPDF
    B-->>E: PDF binary stream
    E->>E: Load PDF in hidden window
    E->>E: window.webContents.print()
    E-->>R: Print dialog shown to user
```

**A4 Invoice PDF includes:**
- Company header (name, GST, phone, address)
- Invoice number + date + due date
- Customer details
- Item table (product, qty, rate, GST, total)
- Grand total with GST breakdown
- Payment history (if any)
- Terms and conditions

**Thermal Receipt (80mm):**
- Condensed layout for POS printers
- Configurable paper width (58mm/80mm)

### 7. Backup & Restore Workflow

```mermaid
flowchart TD
    subgraph "Manual Backup"
        A1[Settings → Backup tab] --> B1[Click Create Backup]
        B1 --> C1[H2 SCRIPT TO → SQL file]
        C1 --> D1[Saved to ~/.billcraft/backups/]
    end
    
    subgraph "Auto Backup"
        A2[Scheduled every 24 hours] --> B2[Check backup count]
        B2 --> C2{Count > 50?}
        C2 -->|Yes| D2[Delete oldest backups]
        C2 -->|No| E2[Create backup]
        D2 --> E2
    end
    
    subgraph "Restore"
        A3[Settings → Select backup file] --> B3[Confirm restore]
        B3 --> C3[H2 DROP ALL OBJECTS]
        C3 --> D3[H2 RUNSCRIPT FROM file]
        D3 --> E3[Database restored]
        E3 --> F3[Re-login required]
    end
```

### 8. Report Generation Workflow

| Report Type | Input | Output |
|------------|-------|--------|
| Daily Sales | Date | Revenue, invoice count, payment breakdown by method |
| Monthly Sales | Year + Month | Daily breakdown, total revenue, chart data |
| GST Report | Date Range | Total GST collected, per-invoice GST details |
| Outstanding Dues | None | All unpaid invoices with customer details |
| Payment Analytics | Date Range | Payment method distribution, trends |

**Export Options:**
- Excel (`.xlsx`) via Apache POI
- CSV (`.csv`) via OpenCSV
- PDF (individual invoices)

### 9. User Management Workflow

```mermaid
flowchart TD
    A[Admin → User Profile page] --> B[View All Users]
    B --> C{Action?}
    C -->|Create| D[Register new user]
    D --> E[Set username, password, role, fullName]
    C -->|Edit| F[Update fullName, email]
    C -->|Toggle| G[Enable/Disable user]
    C -->|Reset Password| H[Admin sets new password]
    
    E --> I[User can now login]
    F --> I
    G --> I
    H --> I
```

**Roles:** ADMIN, MANAGER, CASHIER, ACCOUNTANT

### 10. Application Shutdown Flow

```mermaid
flowchart TD
    A[User closes window] --> B{Minimize to tray?}
    B -->|Yes| C[Hide window, show tray icon]
    B -->|No| D[POST /actuator/shutdown]
    D --> E[Wait 5 seconds]
    E --> F{Backend exited?}
    F -->|Yes| G[app.quit]
    F -->|No| H[tree-kill process tree]
    H --> G
```

## Daily Usage Workflow (Typical Shop)

```
Morning:
  1. Launch BillCraft → Login as admin/cashier
  2. Check Dashboard (today's sales, pending dues)

During Business:
  3. Customer arrives → Search/Create customer
  4. Create Invoice → Add wood products → Set quantities
  5. Record payment (partial or full)
  6. Print invoice (A4 or thermal receipt)
  7. Repeat for each sale

End of Day:
  8. Check Reports → Daily sales summary
  9. Review outstanding dues
  10. Backup (auto or manual)

Monthly:
  11. GST report for filing
  12. Monthly sales analysis
  13. Export data to Excel for accountant
```

## Data Flow Summary

```
User Input → React Page → Axios API Call → Spring Controller
                                                    ↓
                                           Service (business logic)
                                                    ↓
                                           Repository (JPA query)
                                                    ↓
                                           H2 Database (file)
                                                    ↓
                                           Response DTO
                                                    ↓
React Page ← Axios Response ← JSON ← Controller ←──┘
```
