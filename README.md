# KKS Enterprise Smart Retail POS — Multi-Cloud & Multi-Base

စျေးဆိုင်၊ စတိုးဆိုင်နှင့် လက်လီ/လက်ကား လုပ်ငန်းတိုင်း မည်သည့်ကုန်ပစ္စည်းကိုမဆို ဖုန်း၊ တက်ဘလက်၊ ကွန်ပျူတာ စက်မျိုးစုံမှ **အခမဲ့ (Free)**၊ **Online / Offline နှစ်မျိုးလုံး** နှင့် **Multi-User / Multi-Device** တပြိုင်နက် အသုံးပြုနိုင်သော Enterprise POS စနစ်ဖြစ်ပါသည်။

---

## Key Capabilities & Architecture

### 1. Multi-Cloud & Multi-Base Architecture
စနစ်တစ်ခုတည်းအပေါ် မှီခိုနေစရာမလိုဘဲ Data Base (၃) လွှာဖြင့် လုံခြုံစွာ ချိတ်ဆက်အလုပ်လုပ်ပါသည်:
- **Cloud Base 1 — Firebase Firestore Real-Time**: စက်တစ်ခုနှင့်တစ်ခု အချိန်နှင့်တပြေးညီ (Sub-second WebSocket) Stock နှင့် အရောင်းစာရင်းများ Sync လုပ်ပေးသည်။
- **Cloud Base 2 — Multi-Cloud PostgreSQL (ACID Ledger)**:
  - **Google Cloud SQL** (`SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`)
  - **External PostgreSQL (`DATABASE_URL`)** — Neon, Supabase, Railway, Render, AWS RDS, Docker Postgres
  - **Zero-Config Local JSON Multi-Base**: Cloud DB Credential မထည့်ထားသေးသည့်တိုင် GitHub မှ Clone ဆွဲပြီး ချက်ချင်း Run နိုင်ရန် Built-in Local Store ပါဝင်သည်။
- **Edge Base 3 — Offline PWA & Local Storage Queue**: အင်တာနက်ပြတ်တောက်နေချိန်တွင်ပင် အရောင်းဘောက်ချာဖြတ်နိုင်ပြီး လိုင်းပြန်ရသည်နှင့် Firestore နှင့် SQL Bases နှစ်ခုလုံးသို့ အလိုအလျောက် Sync ပြန်လုပ်ပေးသည်။

### 2. Multi-Device & Multi-User Tenancy (`Shop Sync Code`)
- ဆိုင်တစ်ဆိုင်ချင်းစီအတွက် **Shop Sync Code** (ဥပမာ `SHOP-YGN01`) ဖြင့် ဒေတာများကို သီးသန့်ခွဲခြားထားသည်။
- ဆိုင်တစ်ဆိုင်တည်းရှိ ဖုန်းများနှင့် ကောင်တာ PC များတွင် တူညီသော Shop Sync Code ကို ထည့်သွင်းရုံဖြင့် ဘုံသုံး Stock နှင့် ဘောက်ချာများ တပြိုင်နက် Sync ဖြစ်သည်။
- **Private Owner Lock**: Google Sign-In ဝင်ရောက်ပြီး `Private Lock ON` ဖွင့်ထားပါက ပိုင်ရှင် Google UID ဖြင့်သာ ဝင်ရောက်ပြင်ဆင်နိုင်သည်။
- **Portable Backup (.JSON)**: ဆိုင်ဒေတာအားလုံးကို Export/Import လုပ်၍ မည်သည့် Cloud Platform သို့မဆို လွတ်လပ်စွာ ရွှေ့ပြောင်းနိုင်သည်။

### 3. Security Hardening
- **Store-Isolated Firestore Security Rules (`/stores/{storeId}/...`)**: Schema strictness (`hasAll`/`hasOnly`), string length bounds, ID regex validation, non-negative stock/price enforcement, နှင့် Immutable Sales Ledger (`update, delete: if false`)။
- **Backend API Protection (`/server.ts`, `/src/middleware/security.ts`)**: HTTP Security Headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`), Sliding-Window Rate Limiting, Input Sanitization & Payload Schema Validation, Firebase Admin Token verification (`/api/auth/sync`).
- **Diagnostics**: `GET /api/health` endpoint (no secrets exposed) for live status across SQL, Firestore, and AI Search.

---

## Quick Start (Free Self-Hosting / GitHub Clone)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional - runs in Zero-Config Mode even without .env!)
cp .env.example .env

# 3. Start full-stack development server (Vite + Express API)
npm run dev

# 4. Build & run production server
npm run build
npm start
```

### Optional PostgreSQL Schema Push (Neon / Supabase / Cloud SQL / Docker)
```bash
npx drizzle-kit push --config=src/db/drizzle.config.ts
```

---

## GitHub Security Checklist Before Pushing
- [x] `.env`, `*.pem`, `*.key`, `*serviceAccount*.json` excluded via `.gitignore`
- [x] Zero private API keys or database passwords committed in source code
- [x] Firestore Security Rules validated & deployed (`firestore.rules`)
- [x] Rate limiting & strict payload sanitization active on all `/api/*` routes
